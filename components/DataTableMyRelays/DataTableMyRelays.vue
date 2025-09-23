<script lang="ts" setup>
import { useAccount, useReadContract } from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import { type RelayRow, type RelayTabType } from '@/types/relay';
import { RELAY_COLUMS, TABS, VERBS } from '@/constants/relay';
import { useMetricsStore } from '@/stores/useMetricsStore';

import Tabs from '../ui-kit/Tabs.vue';
import Tooltip from '../ui-kit/Tooltip.vue';
import Popover from '../ui-kit/Popover.vue';

import BigNumber from 'bignumber.js';

import LockStatusColumn from './columns/LockStatusColumn.vue';
import RegistrationActionColumn from './columns/RegistrationActionColumn.vue';
import { ethers } from 'ethers';
import { defineProps, useTemplateRef } from 'vue';
import { fetchHardwareStatus } from '@/composables/utils/useHardwareStatus';
import { useHodler } from '~/composables/hodler';
import { hodlerAbi } from '~/assets/abi/hodler';
import { getBlock } from '@wagmi/core';
import { useDebounceFn } from '@vueuse/core';
import { useQueries } from '@tanstack/vue-query';
import type { LastRoundData } from '~/composables/relay-rewards';
import Ticker from '../ui-kit/Ticker.vue';

const props = defineProps<{
  currentTab: RelayTabType;
  registerModalOpen: boolean;
}>();

const toast = useToast();
const userStore = useUserStore();
const metricsStore = useMetricsStore();
const hodlerStore = useHolderStore();
const operatorRegistry = useOperatorRegistry();
const hodler = useHodler();

const isHovered = ref(false);
const isUnlocking = ref(false);

const { allRelays, claimableRelays } = storeToRefs(userStore);

const { address, isConnected } = useAccount({ config } as any);
const registerModalOpen = ref(false);

const runtimeConfig = useRuntimeConfig();
const relayRewardsProcessId = runtimeConfig.public.relayRewardsProcessId;

// watch(lastRound, (newRounds) => {
//   if (newRounds) {
//     console.log('Last round data:', toRaw(newRounds));

//     fingerprints.value.forEach((fp) => {
//       if (newRounds[fp]) {
//         console.log(
//           `Last round details for ${fp}:`,
//           toRaw(newRounds[fp].Details)
//         );
//       }
//     });
//   }
// });

onMounted(() => {
  // refresh everything every 60 seconds
  setInterval(() => {
    if (hodler) {
      if (userStore.userData.address) {
        hodler.refresh();
      }
    }
  }, 1000 * 60);
});

// Fetching and refreshing the relay data from Warp - stored in Pinia user store
const { error: allRelaysError, pending: allRelaysPending } = useAsyncData(
  'verifiedRelays',
  () => userStore.createRelayCache(),
  {
    server: false,
    watch: [address],
  }
);

const relayCredits = ref<Record<string, boolean | undefined>>({});
const familyVerified = ref<Record<string, boolean>>({});
const registrationCreditsRequired = ref<boolean>(false);
const familyRequired = ref<boolean>(true);

const fetchRegistrationCredit = async () => {
  if (allRelays.value) {
    console.log('fetchRegistrationCredit..................');
    for (const relay of filterUniqueRelays(allRelays.value)) {
      relayCredits.value[relay.fingerprint] =
        await userStore.hasRegistrationCredit(relay.fingerprint);
      familyVerified.value[relay.fingerprint] = await userStore.familyVerified2(
        relay.fingerprint
      );
    }
  }

  // registrationCreditsRequired.value = userStore.registrationCreditsRequired;
  familyRequired.value = userStore.familyRequired;
};

// Fetch the registration credits when the relays are loaded
watch(
  () => allRelays.value,
  async () => {
    fetchRegistrationCredit();
  }
);

const { locks: lockedRelays, loading: lockedRelaysPending } =
  storeToRefs(hodlerStore);

const lockedRelaysMap = ref<Record<string, boolean | undefined>>({});

// const lockedRelaysPending = ref<boolean>(true);
watch(
  [
    () => hodlerStore.locks,
    () => allRelays.value,
    address,
    lockedRelaysPending,
  ],
  async ([locks, relays]) => {
    if (lockedRelaysPending.value) return;
    lockedRelaysPending.value = true;
    let data: Record<string, boolean | undefined> = {};
    for (const fingerprint of Object.keys(locks)) {
      data[fingerprint] = true; // All fingerprints in locks are locked
    }
    lockedRelaysMap.value = data;
    lockedRelaysPending.value = false;
  }
);

const {
  data: isHardwareResolved,
  error: hardwareStatusError,
  pending: hardwareStatusPending,
} = await useAsyncData(
  'hardwareStatus',
  () => fetchHardwareStatus(allRelays.value.map((relay) => relay.fingerprint)),
  { watch: [() => allRelays.value] }
);

const ethAddress = ref<string>('');
const ethAddressError = ref<string | null>(null);
const fingerPrintRegister = ref<string>('');
const fingerPrintRegisterError = ref<string | null>(null);

const relayActionOngoing = ref<boolean>(false);

if ((allRelaysError as any).value?.cause?.message == 'rate limited') {
  toast.add({
    id: 'claimable-relays-error',
    icon: 'i-heroicons-exclamation-triangle',
    color: 'primary',
    title: 'Arweave rate limit exceeded!',
    timeout: 0,
    description: 'Please wait...',
  });
}

const timestamp = computed(
  () => metricsStore.relays.timestamp && new Date(metricsStore.relays.timestamp)
);

const relayAction = async (
  action: 'claim' | 'renounce',
  fingerprint: string
) => {
  const selectedRow = allRelays.value.find(
    (row) => row.fingerprint === fingerprint
  );
  selectedRow!.isWorking = true;
  relayActionOngoing.value = true;
  selectedRow!.class = 'animate-pulse bg-green-100 dark:bg-zinc-600';

  try {
    let actionPromise;
    switch (action) {
      case 'claim':
        // actionPromise = registry.claim(fingerprint);
        actionPromise = operatorRegistry.claim(fingerprint);
        break;

      case 'renounce':
        // actionPromise = registry.renounce(fingerprint);
        actionPromise = operatorRegistry.renounce(fingerprint);
        break;

      default:
        throw new Error('Invalid action');
    }

    actionPromise
      .then(async (res) => {
        if (!res) {
          selectedRow!.class = '';
          selectedRow!.isWorking = false;
          relayActionOngoing.value = false;
          return;
        }

        const maxRetries = 3;
        let retryCount = 0;

        // Exponential backoff retry function
        const retryWithBackoff = async (retryDelay: number) => {
          retryCount++;

          // Refresh relays after delay
          await new Promise((resolve) => setTimeout(resolve, retryDelay));

          await userStore.createRelayCache();

          // Check if the relay status has updated
          const index = allRelays.value.findIndex(
            (row) => row.fingerprint === fingerprint
          );

          if (action === 'claim') {
            if (index !== -1 && allRelays.value[index].status === 'verified') {
              // Relay is successfully claimed

              toast.add({
                icon: 'i-heroicons-check-circle',
                color: 'primary',
                title: 'Success',
                timeout: 0,
                description: `Successfully ${
                  VERBS[action].pastTense
                } relay ${truncatedAddress(fingerprint)}!`,
              });
              return; // Exit on success
            }
          } else if (action === 'renounce') {
            if (index === -1) {
              // Relay is successfully removed after renounce
              toast.add({
                icon: 'i-heroicons-check-circle',
                color: 'primary',
                title: 'Success',
                timeout: 0,
                description: `Successfully ${
                  VERBS[action].pastTense
                } relay ${truncatedAddress(fingerprint)}!`,
              });
              return; // Exit on success
            }
          }

          if (retryCount < maxRetries) {
            const newRetryDelay = retryDelay * 2; // Exponential backoff
            console.log(`Retrying... (Attempt ${retryCount + 1})`);
            await retryWithBackoff(newRetryDelay);
          } else {
            console.log('Max retries reached. Relay status did not update.');
            toast.add({
              icon: 'i-heroicons-x-circle',
              color: 'amber',
              title: 'Error',
              description: `Failed to update relay status after multiple attempts.`,
            });
          }
        };

        await retryWithBackoff(5000);
      })
      .catch((error) => {
        if (error?.code !== 'ACTION_REJECTED') {
          toast.add({
            icon: 'i-heroicons-x-circle',
            color: 'amber',
            title: 'Error',
            description: `Error ${
              VERBS[action].presentTense
            } relay ${truncatedAddress(fingerprint)}!`,
          });
        }
      })
      .finally(() => {
        selectedRow!.class = '';
        selectedRow!.isWorking = false;
        relayActionOngoing.value = false;
      });
  } catch (error) {
    selectedRow!.class = '';
    selectedRow!.isWorking = false;
    relayActionOngoing.value = false;
  }
};

// Table columns and actions

const getVerifiedItems = (row: RelayRow) => {
  // if locked, show unlock and claimed, else show renounce

  const isHardware = isHardwareResolved.value?.[row.fingerprint];
  const isLocked = hodlerStore.relayIsLocked(row.fingerprint);
  const isClaimed = row.status === 'verified';
  const skipSideMenu = !isClaimed && !isLocked && !isHardware;

  const items = [];

  if (skipSideMenu) {
    return [[]];
  }

  if (isLocked) {
    items.push({
      // unlock relay
      label: 'Unlock',
      icon: 'i-heroicons-lock-open-20-solid',
      click: () => handleUnlockClick(row.fingerprint),
    });
  } else if (!isHardware) {
    items.push({
      label: 'Lock',
      icon: 'i-heroicons-lock-closed-20-solid',
      click: () => handleLockRelay(row.fingerprint),
    });
  }

  if (isClaimed) {
    items.push({
      label: 'Renounce',
      icon: 'i-heroicons-trash-20-solid',
      click: () => relayAction('renounce', row.fingerprint),
    });
  }

  return [items];
};

const rules = {
  required: (value: string) => !!value || 'Required',
};

const emits = defineEmits(['update:currentTab']);

const handleTabChange = (key: string) => {
  emits('update:currentTab', key);
};

const handleLockRelay = async (fingerprint: string) => {
  const selectedRow = allRelays.value.find(
    (row) => row.fingerprint === fingerprint
  );
  selectedRow!.isWorking = true;
  relayActionOngoing.value = true;
  selectedRow!.class = 'animate-pulse bg-green-100 dark:bg-zinc-600';

  const maxTries = 3;

  // retry untill maxRetry or the registrationcredit is removed
  const searchWithBackoff = async (currentTry: number) => {
    if (currentTry > maxTries) {
      return;
    }

    userStore.createRelayCache().then(async () => {
      await fetchRegistrationCredit();
      if (relayCredits.value[fingerprint] === false) {
        console.log('Registration credit removed at attempt: ', currentTry);
        return;
      }
    });

    console.log(`Didn't remove lock yet... (Attempt ${currentTry})`);

    setTimeout(() => {
      searchWithBackoff(currentTry + 1);
    }, 5000 * currentTry);
  };

  try {
    const hodler = useHodler();
    hodler?.lock(fingerprint, '').then(async (result) => {
      searchWithBackoff(0);

      selectedRow!.class = '';
      selectedRow!.isWorking = false;
      relayActionOngoing.value = false;
    });
  } catch {
    selectedRow!.class = '';
    selectedRow!.isWorking = false;
    relayActionOngoing.value = false;
  }
};

// for modal
const handleLockRemote = async () => {
  if (fingerPrintRegisterError.value || ethAddressError.value) {
    return;
  }

  // check for empty
  if (fingerPrintRegister.value == '' || ethAddress.value == '') {
    toast.remove('invalid-evm-address');
    toast.add({
      id: 'invalid-evm-address',
      icon: 'i-heroicons-x-circle',
      color: 'amber',
      title: 'Error',
      description: `Please fill in all fields`,
    });
    return;
  }

  if (!ethers.isAddress(ethAddress.value)) {
    toast.remove('invalid-evm-address');
    toast.add({
      id: 'invalid-evm-address',
      icon: 'i-heroicons-x-circle',
      color: 'amber',
      title: 'Error',
      description: `Invalid EVM address`,
    });
    return;
  }

  try {
    const hodler = useHodler();
    const success = await hodler?.lock(
      fingerPrintRegister.value,
      ethAddress.value
    );
    if (success != null && typeof success != typeof Error) {
      registerModalOpen.value = false;
    } else {
      toast.remove('invalid-evm-address');
      toast.add({
        id: 'invalid-evm-address',
        icon: 'i-heroicons-x-circle',
        color: 'amber',
        title: 'Error',
        description: `Error registering relay`,
      });
    }
  } catch (error: any) {}
};

const filterUniqueRelays = (relays: RelayRow[]) => {
  const seen = new Set();

  return relays.filter((relay) => {
    const duplicate = seen.has(relay.fingerprint);
    seen.add(relay.fingerprint);
    return !duplicate;
  });
};

const getTableData = (tab: RelayTabType) => {
  switch (tab) {
    case 'locked':
      return Object.keys(hodlerStore.locks).map((fingerprint) => ({
        fingerprint,
        nickname: userStore.relaysMeta?.[fingerprint]?.nickname || '-',
        observedBandwidth: getObservedBandwidth(fingerprint),
      }));
    case 'all':
      return filterUniqueRelays(allRelays.value);
    case 'claimable':
      return claimableRelays.value;
    case 'unlocked':
      return vaults.value;
  }
};

const getObservedBandwidth = (fingerprint: string) => {
  return (
    BigNumber(userStore?.relaysMeta?.[fingerprint]?.observed_bandwidth)
      .dividedBy(Math.pow(1024, 2))
      .toFormat(3) + ' MB/s'
  );
};

// console.log();

const handleUnlockClick = async (fingerprint: string) => {
  isUnlocking.value = true;
  const hodler = useHodler();
  try {
    await hodler?.unlock(fingerprint, userStore.userData.address!);
    // Refresh the relays
    await userStore.createRelayCache();
  } catch (error) {
  } finally {
    isUnlocking.value = false;
  }
};

const hodlerContract = runtimeConfig.public.hodlerContract as `0x${string}`;

const {
  data: vaultsData,
  isPending: vaultsPending,
  refetch: refetchVaults,
} = useReadContract({
  address: hodlerContract,
  abi: hodlerAbi,
  functionName: 'getVaults',
  args: [address.value as `0x${string}`],
  query: {
    enabled: computed(() => isConnected.value),
  },
});

// watch(vaultsData, (newVaults) => {
//   if (newVaults) {
//     console.log('Vaults data updated:', newVaults);
//   }
// });

const vaults = computed(() => {
  if (!vaultsData.value) return [];
  const data = vaultsData.value
    .filter((vault) => vault.kind === 1n) // 1n for locked
    .map((vault) => {
      const data = `0x${vault.data.slice(2).toUpperCase()}`;
      return {
        amount: vault.amount,
        data,
        kind: vault.kind,
        availableAt: vault.availableAt,
      };
    });
  return data;
});

const block = await getBlock(config);

const ITEMS_PER_LOAD = 10;
const visibleItems = ref(ITEMS_PER_LOAD);
const visibleRelays = computed(() => {
  return getTableData(props.currentTab).slice(0, visibleItems.value);
});

// The user's relays
const fingerprints = computed(() => {
  return visibleRelays.value
    .filter((relay) => 'fingerprint' in relay)
    .map((relay) => relay.fingerprint);
});

const getLastRoundData = async (fingerprint: string) => {
  // console.log('Fetching last round data for fingerprint:', fingerprint);
  // return null;
  try {
    const { result } = await sendAosDryRun({
      processId: relayRewardsProcessId,
      tags: [
        { name: 'Action', value: 'Last-Round-Data' },
        { name: 'Fingerprint', value: fingerprint },
      ],
    });

    if (result.Error) {
      console.error('AOS Error: ' + result.Error);
      return null;
    }
    if (!result.Messages.length || !result.Messages[0].Data) {
      console.error(`No data found for fingerprint: ${fingerprint}`);
      return null;
    }

    // console.log('Last round result:', result.Messages[0].Data);
    return JSON.parse(result.Messages[0].Data) as LastRoundData;
  } catch (error) {
    console.error('Error fetching last round data:', error);
    return null;
  }
};

const lastRoundResults = useQueries({
  queries: computed(() =>
    fingerprints.value.map((fp) => ({
      queryKey: computed(() => ['lastRound', fp]),
      queryFn: () => getLastRoundData(fp),
      staleTime: Infinity,
    }))
  ),
  combine: (results) => {
    return {
      data: results.map((result) => result.data),
      pending: results.some((result) => result.isPending),
    };
  },
});

const lastRound = computed(() => {
  const rounds: Record<string, LastRoundData> = {};
  lastRoundResults.value.data.forEach((data, index) => {
    // console.log('Last round query result:', toRaw(query.data));
    if (data) {
      rounds[fingerprints.value[index]] = data;
    }
  });
  return rounds;
});

const lastRoundPending = computed(() => lastRoundResults.value.pending);
// const lastRoundSuccess = computed(() =>
//   lastRoundResults.value.data.length
// );

const target = useTemplateRef<HTMLDivElement>('target');

const relayTableRef = useTemplateRef('relayTableRef');
const hasMoreItems = computed(() => {
  return visibleItems.value < getTableData(props.currentTab).length;
});

const handleScroll = () => {
  if (!relayTableRef.value) return;
  const wrapper = relayTableRef.value.$el;
  const { scrollTop, scrollHeight, clientHeight } = wrapper;
  // console.log('Scroll event:', { visibleItems: visibleItems.value });
  if (scrollHeight - scrollTop - clientHeight < 100 && hasMoreItems.value) {
    // console.log('Loading more items...');
    visibleItems.value += ITEMS_PER_LOAD;
    nextTick(() => {
      wrapper.scrollTop = scrollTop; // Maintain scroll position
    });
  }
};

// watch(visibleItems, (newVal) => {
//   console.log('Visible items changed:', newVal);
// });

const debouncedHandleScroll = useDebounceFn(handleScroll, 300);

watch(
  [allRelays, claimableRelays, props.currentTab],
  async () => {
    if (process.client && relayTableRef.value) {
      await nextTick(); // Ensure DOM is updated
      visibleItems.value = ITEMS_PER_LOAD; // Reset on tab change
      relayTableRef.value.$el.addEventListener('scroll', debouncedHandleScroll);
      return () => {
        relayTableRef.value?.$el.removeEventListener(
          'scroll',
          debouncedHandleScroll
        );
      };
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  if (process.client && relayTableRef.value) {
    relayTableRef.value.$el.removeEventListener(
      'scroll',
      debouncedHandleScroll
    );
  }
});
</script>

<template>
  <UModal v-model="registerModalOpen">
    <UCard class="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h4
        class="text-lg font-semibold mb-4 border-b border-b-[rgba(255,255,255,0.1)] pb-4"
      >
        Register Fingerprint
      </h4>
      <UContainer class="">
        <div class="mb-6">
          <UFormGroup label="EVM Address" class="mb-6">
            <UInput
              ref="ethAddressField"
              v-model="ethAddress"
              hint="EVM address associated with fingerprint"
              placeholder="EVM Address"
              :rules="[rules.required]"
              :error="ethAddressError !== null"
              persistent-hint
              class="mb-1"
            >
              <template #message="{ message }">
                <UIcon name="w-4 h-4">mdi-alert</UIcon>
                {{ message }}
              </template>
            </UInput>
          </UFormGroup>
          <UFormGroup label="Relay Fingerprint">
            <UInput
              ref="fingerPrintField"
              v-model="fingerPrintRegister"
              hint="Fingerprint associated with EVM Address"
              placeholder="Relay Fingerprint"
              :rules="[rules.required]"
              :error="fingerPrintRegisterError !== null"
              persistent-hint
              class="mb-1"
            >
              <template #message="{ message }">
                <UIcon name="w-4 h-4">mdi-alert</UIcon>
                {{ message }}
              </template>
            </UInput>
          </UFormGroup>
        </div>
        <div class="flex justify-between">
          <UButton
            variant="outline"
            size="sm"
            color="red"
            @click="registerModalOpen = false"
          >
            Cancel
          </UButton>
          <UDivider />
          <UButton
            variant="outline"
            size="sm"
            color="primary"
            @click="handleLockRemote"
          >
            Register
          </UButton>
        </div>
      </UContainer>
    </UCard>
  </UModal>
  <div class="-mx-4 sm:-mx-0 overflow-hidden">
    <UAlert
      v-if="(allRelaysError as any)?.value || (allRelaysError as any)?.value"
      class="mb-6"
      icon="i-heroicons-exclamation-triangle"
      description="There was an error retrieving relays. We'll load what we can."
      title="Relay error"
      color="red"
      variant="subtle"
    />
    <Tabs :tabs="TABS" @onChange="handleTabChange" />

    <UTable
      ref="relayTableRef"
      class="max-h-[50svh] md:max-h-[65svh] overflow-y-auto"
      :loading="allRelaysPending || vaultsPending"
      :columns="RELAY_COLUMS[currentTab]"
      :rows="visibleRelays"
      :ui="{ td: { base: 'max-w-sm truncate' } }"
      :empty-state="{
        icon: 'i-heroicons-circle-stack-20-solid',
        label:
          currentTab === 'claimable'
            ? 'No claimable relays!'
            : currentTab === 'unlocked'
              ? 'No unlocked tokens!'
              : 'No locked or delegated-locked relays!',
      }"
    >
      <template #actions-data="{ row }">
        <div class="w-8">
          <Icon
            v-if="row.isWorking"
            name="heroicons:arrow-path-20-solid"
            class="h-6 w-6 animate-spin"
          />
          <UDropdown
            v-if="
              !row.isWorking &&
              (row.status === 'verified' ||
                hodlerStore.relayIsLocked(row.fingerprint) ||
                isHardwareResolved?.[row.fingerprint])
            "
            :items="getVerifiedItems(row)"
            :popper="{ placement: 'left-end' }"
          >
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-ellipsis-horizontal-20-solid"
            />
          </UDropdown>
        </div>
      </template>
      <template #fingerprint-data="{ row }">
        <span class="monospace">{{ row.fingerprint }}</span>
      </template>
      <template #nickname-data="{ row }">
        {{ userStore?.relaysMeta?.[row.fingerprint]?.nickname || '-' }}
      </template>
      <template #previousDistribution-header="{ column }">
        <div class="flex gap-1 items-center">
          <span>{{ column.label }}</span>
          <Popover placement="top" :arrow="false">
            <template #content>
              <div class="text-xs font-normal text-gray-600 dark:text-gray-300">
                The number of tokens earned by this relay in the last
                distribution period.
              </div>
            </template>
            <template #trigger>
              <div><Icon name="heroicons:exclamation-circle" /></div>
            </template>
          </Popover>
        </div>
      </template>
      <template #previousDistribution-data="{ row }: { row: RelayRow }">
        <div class="relative flex gap-1 items-center">
          <div>
            <span v-if="lastRound[row.fingerprint]?.Details?.Reward?.Total">
              {{
                formatEtherNoRound(
                  new BigNumber(
                    lastRound[row.fingerprint].Details.Reward.Total
                  ).toString(),
                  3
                )
              }}
            </span>
            <span v-else>-</span>
            <Ticker class="text-[9px] leading-tight ml-1" />
          </div>
          <Popover
            placement="right"
            :arrow="false"
            mode="hover"
            :disabled="lastRoundPending"
          >
            <template #content>
              <div class="p-1 px-4">
                <div
                  class="text-xs font-normal text-green-600 dark:text-green-300"
                >
                  <span class="text-gray-800 dark:text-white"
                    >Base Tokens:
                  </span>
                  <span
                    v-if="lastRound[row.fingerprint]?.Details?.Reward?.Network"
                  >
                    {{
                      `${formatEtherNoRound(
                        new BigNumber(
                          lastRound[row.fingerprint].Details.Reward.Network
                        ).toString(),
                        3
                      )} $ANYONE`
                    }}
                  </span>
                  <span v-else>-</span>
                </div>
                <div
                  class="text-xs font-normal text-gray-600 dark:text-gray-300"
                >
                  <span class="text-gray-800 dark:text-white"
                    >Family Multiplier:
                  </span>
                  <span
                    v-if="
                      lastRound[row.fingerprint]?.Details?.Variables
                        ?.FamilyMultiplier
                    "
                  >
                    {{
                      formatEtherNoRound(
                        new BigNumber(
                          lastRound[
                            row.fingerprint
                          ].Details.Variables.FamilyMultiplier
                        ).toString()
                      )
                    }}
                  </span>
                  <span v-else>-</span>
                </div>
                <div
                  class="text-xs font-normal text-gray-600 dark:text-gray-300 mb-2"
                >
                  <span class="text-gray-800 dark:text-white"
                    >Region Multiplier:
                  </span>
                  <span
                    v-if="
                      lastRound[row.fingerprint]?.Details?.Variables
                        ?.LocationMultiplier
                    "
                  >
                    {{
                      formatEtherNoRound(
                        new BigNumber(
                          lastRound[
                            row.fingerprint
                          ].Details.Variables.LocationMultiplier
                        ).toString()
                      )
                    }}
                  </span>
                  <span v-else>-</span>
                </div>
                <div
                  class="text-xs font-normal text-cyan-600 dark:text-cyan-300"
                >
                  <span class="text-gray-800 dark:text-white"
                    >Hardware Bonus:
                  </span>
                  <span
                    v-if="lastRound[row.fingerprint]?.Details?.Reward?.Hardware"
                  >
                    {{
                      `${formatEtherNoRound(
                        new BigNumber(
                          lastRound[row.fingerprint].Details.Reward.Hardware
                        ).toString(),
                        3
                      )} $ANYONE`
                    }}
                  </span>
                  <span v-else>-</span>
                </div>
                <div
                  class="text-xs font-normal text-indigo-700 dark:text-violet-300"
                >
                  <span class="text-gray-800 dark:text-white"
                    >Uptime Bonus:
                  </span>
                  <span
                    v-if="lastRound[row.fingerprint]?.Details?.Reward?.Uptime"
                  >
                    {{
                      `${formatEtherNoRound(
                        new BigNumber(
                          lastRound[row.fingerprint].Details.Reward.Uptime
                        ).toString(),
                        3
                      )} $ANYONE`
                    }}
                  </span>
                  <span v-else>-</span>
                </div>
                <div
                  class="text-xs font-normal text-red-400 dark:text-red-400 mb-2"
                >
                  <span class="text-gray-800 dark:text-white"
                    >Exit Bonus:
                  </span>
                  <span
                    v-if="
                      lastRound[row.fingerprint]?.Details?.Reward?.ExitBonus
                    "
                  >
                    {{
                      `${formatEtherNoRound(
                        new BigNumber(
                          lastRound[row.fingerprint].Details.Reward.ExitBonus
                        ).toString(),
                        3
                      )} $ANYONE`
                    }}
                  </span>
                  <span v-else>-</span>
                </div>
                <div
                  class="text-xs font-normal text-stone-700 dark:text-stone-300"
                >
                  <span class="text-gray-800 dark:text-white">Period: </span>
                  <span v-if="lastRound[row.fingerprint]?.Period">
                    {{ lastRound[row.fingerprint].Period / 60 + ' minutes' }}
                  </span>
                  <span v-else>-</span>
                </div>
                <div
                  class="text-xs font-normal text-stone-700 dark:text-stone-300"
                >
                  <span class="text-gray-800 dark:text-white"
                    >Last Distribution:
                  </span>
                  <span v-if="lastRound[row.fingerprint]?.Timestamp">
                    {{ formatTimeAgo(lastRound[row.fingerprint].Timestamp) }}
                  </span>
                  <span v-else>-</span>
                </div>
              </div>
            </template>
            <template #trigger>
              <div class="-mt-6 cursor-context-menu hover:text-[#24adc3]">
                <Icon name="heroicons:exclamation-circle" />
              </div>
            </template>
          </Popover>
        </div>
      </template>

      <template #active-data="{ row }">
        <div class="flex items-center">
          <span
            v-if="userStore?.relaysMeta?.[row.fingerprint]?.running === true"
            class="status-active"
          ></span>
          <span
            v-else-if="
              userStore?.relaysMeta?.[row.fingerprint]?.running === false
            "
            class="status-inactive"
          ></span>
          <span v-else>-</span>
        </div>
      </template>

      <template #consensusWeight-data="{ row }">
        <template v-if="metricsStore.relayMetricsPending">
          <USkeleton class="w-[15rem] h-10" />
        </template>
        <span
          v-else-if="
            userStore?.relaysMeta?.[row.fingerprint]?.consensus_weight !==
            undefined
          "
        >
          {{ userStore?.relaysMeta?.[row.fingerprint]?.consensus_weight }}
        </span>
        <span v-else class="text-sm flex items-center gap-2">
          <Icon
            name="heroicons:exclamation-circle"
            class="h-4 w-4 text-red-500"
          />
          Unable to fetch
        </span>
      </template>
      <template #observedBandwidth-data="{ row }">
        <template v-if="metricsStore.relayMetricsPending">
          <USkeleton class="w-[15rem] h-10" />
        </template>
        <span
          v-else-if="
            userStore?.relaysMeta?.[row.fingerprint]?.observed_bandwidth !==
            undefined
          "
        >
          {{ getObservedBandwidth(row.fingerprint) }}
        </span>
        <span v-else class="text-sm flex items-center gap-2">
          <Icon
            name="heroicons:exclamation-circle"
            class="h-4 w-4 text-red-500"
          />
          Unable to fetch
        </span>
      </template>

      <template #lockStatus-header="{ column }">
        <div class="flex gap-1 items-center">
          <span>{{ column.label }}</span>
          <Tooltip
            placement="top"
            arrow
            text="Shows the current lock status of the Registration."
          >
            <Icon name="heroicons:exclamation-circle" class="h-4" />
          </Tooltip>
        </div>
      </template>
      <template #lockStatus-data="{ row }">
        <LockStatusColumn
          :is-locked="lockedRelaysMap[row.fingerprint]"
          :is-hardware="isHardwareResolved?.[row.fingerprint]"
          :is-verified="row.status === 'verified'"
          :is-loading="
            hodlerStore.loading || lockedRelaysPending || allRelaysPending
          "
        />
      </template>

      <template #status-header="{ column }">
        <div class="relative flex gap-1 items-center">
          <span>{{ column.label }}</span>
          <Popover placement="top" :arrow="false">
            <template #content>
              <div class="text-sm font-medium text-cyan-500 mb-3">
                Registration Status
              </div>

              <div class="text-xs font-normal text-gray-600 dark:text-gray-300">
                <span class="text-gray-800 dark:text-white">Claimable:</span>
                'Claim Now' button is active
              </div>
              <div class="text-xs font-normal text-gray-600 dark:text-gray-300">
                <span class="text-gray-800 dark:text-white">Claimed:</span> This
                item has already been claimed. No further action is needed.
              </div>
              <div class="text-xs font-normal text-gray-600 dark:text-gray-300">
                <span class="text-gray-800 dark:text-white">No Credit:</span>
                Your lock was successful, but is not yet confirmed on Arweave.
              </div>
              <!-- <div class="text-xs font-normal text-gray-600 dark:text-gray-300">
                <span class="text-gray-800 dark:text-white">Locked:</span> Your
                lock tx is awaiting Arweave confirmation.
              </div> -->
            </template>
            <template #trigger>
              <div><Icon name="heroicons:exclamation-circle" /></div>
            </template>
          </Popover>
        </div>
      </template>
      <template #status-data="{ row }">
        <RegistrationActionColumn
          :row="row"
          @relay-action="relayAction"
          @on-lock-relay="handleLockRelay"
          :is-locked="
            lockedRelaysMap[row.fingerprint] ||
            row.status === 'verified' ||
            isHardwareResolved?.[row.fingerprint]
          "
          :is-loading="
            hodlerStore.loading || lockedRelaysPending || allRelaysPending
          "
          :has-registration-credit="relayCredits[row.fingerprint]"
          :registration-credits-required="registrationCreditsRequired ?? false"
          :family-verified="familyVerified[row.fingerprint]"
          :family-required="familyRequired"
          :relay-action-ongoing="relayActionOngoing"
        />
      </template>
      <template #unlock-data="{ row }">
        <UButton
          :ui="{ base: 'text-sm' }"
          icon="i-heroicons-check-circle-solid"
          size="xl"
          color="green"
          variant="outline"
          label="Unlock"
          :trailing="false"
          :disabled="isUnlocking"
          @click="handleUnlockClick(row.fingerprint)"
          @mouseover="isHovered = true"
          @mouseleave="isHovered = false"
        />
      </template>
      <template #owner-data="{ row }">
        <UBadge
          v-if="
            hodlerStore.isRelayOwner(
              row.fingerprint,
              userStore.userData.address!
            )
          "
          color="white"
          variant="solid"
        >
          Owner
        </UBadge>
        <UBadge v-else color="cayan" variant="outline"> Others </UBadge>
      </template>

      <template #data-data="{ row }">
        <div class="flex items-center">
          <span>{{ truncatedAddress(row.data) }}</span>
        </div>
      </template>
      <template #amount-data="{ row }">
        {{ formatEtherNoRound(row.amount) }}
      </template>
      <template #availableAt-data="{ row }">
        <span>{{
          formatAvailableAt(row.availableAt, block) === 'Expired'
            ? '0D 0H 0S'
            : formatAvailableAt(row.availableAt, block)
        }}</span>
      </template>

      <template #vaultStatus-data="{ row }">
        <UBadge
          :color="
            formatAvailableAt(row.availableAt, block) === 'Expired'
              ? 'green'
              : 'white'
          "
          variant="outline"
        >
          {{
            formatAvailableAt(row.availableAt, block) === 'Expired'
              ? 'Available'
              : 'Locked'
          }}
        </UBadge>
      </template>
    </UTable>
  </div>
</template>

<style scoped lang="scss">
.status-active,
.status-inactive {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}
// TODO: use variables
.status-active {
  background: #00ff84;
}

.status-inactive {
  background: #fa5858;
}

.cursor-not-allowed,
.disabled {
  cursor: not-allowed;
}

.monospace {
  font-family: 'Courier New', Courier, monospace;
}

// .cursor-pointer {
//   cursor: pointer;
// }
</style>
