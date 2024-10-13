<script lang="ts" setup>
import { useAccount } from '@wagmi/vue';
import type { FunctionName } from '@/utils/warp.write';
import { useRelayRegistry } from '@/composables/relay-registry';
import { config } from '@/config/wagmi.config';
import { type RelayRow, type RelayTabType } from '@/types/relay';
import { RELAY_COLUMS, TABS, VERBS } from '@/constants/relay';
import { useMetricsStore } from '@/stores/useMetricsStore';
import { useFacilitatorStore } from '@/stores/useFacilitatorStore';
import FingerprintDisplay from './FingerprintDisplay.vue';

import Tabs from '../ui-kit/Tabs.vue';
import Tooltip from '../ui-kit/Tooltip.vue';
import Popover from '../ui-kit/Popover.vue';

import BigNumber from 'bignumber.js';

import LockStatusColumn from './columns/LockStatusColumn.vue';
import RegistrationActionColumn from './columns/RegistrationActionColumn.vue';
import { useRegistrator } from '@/composables/registrator';
import { useRegistratorStore } from '@/stores/useRegistratorStore';
import { ethers } from 'ethers';
import { watchAccount } from '@wagmi/core';
import { defineProps } from 'vue';
import { fetchHardwareStatus } from '@/composables/utils/useHardwareStatus';

const props = defineProps<{
  currentTab: RelayTabType;
  registerModalOpen: boolean;
}>();

const toast = useToast();
const userStore = useUserStore();
const registry = useRelayRegistry();
const metricsStore = useMetricsStore();
const registratorStore = useRegistratorStore();
const facilitatorStore = useFacilitatorStore();
const registrator = useRegistrator();

const isHovered = ref(false);
const isUnlocking = ref(false);

const { allRelays, claimableRelays } = storeToRefs(userStore);
const { address } = useAccount({ config } as any);
const registerModalOpen = ref(false);

onMounted(() => {
  // refresh the locked relays every minute
  setInterval(() => {
    if (registrator) {
      if (userStore.userData.address) {
        // refresh the relays every minute
        registrator.getLokedRelaysTokens(userStore.userData.address);
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
const registrationCreditsRequired = ref<boolean>(true);
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

  registrationCreditsRequired.value = userStore.registrationCreditsRequired;
  familyRequired.value = userStore.familyRequired;
};

// Fetch the registration credits when the relays are loaded
watch(allRelays, async () => {
  await fetchRegistrationCredit();
});

const { lokedRelays: lockedRelays, loading: lockedRelaysPending } =
  storeToRefs(registratorStore);

const lockedRelaysMap = ref<Record<string, boolean | undefined>>({});

// const lockedRelaysPending = ref<boolean>(true);
watch(
  [
    () => lockedRelays.value,
    () => allRelays.value,
    address,
    lockedRelaysPending,
  ],
  async ([lockedRelays, relays, address]) => {
    if (lockedRelaysPending.value) {
      return;
    }

    if (lockedRelays && relays.length) {
      lockedRelaysPending.value = true;
      let data: Record<string, boolean | undefined> = {};
      for (const relay of relays) {
        const isLocked = lockedRelays[relay.fingerprint] !== undefined;
        data[relay.fingerprint] = isLocked;
      }

      lockedRelaysMap.value = data;

      lockedRelaysPending.value = false;
    }
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
  { watch: [allRelays] }
);

const ethAddress = ref<string>('');
const ethAddressError = ref<string | null>(null);
const fingerPrintRegister = ref<string>('');
const fingerPrintRegisterError = ref<string | null>(null);

// const relayCredits = ref<Record<string, boolean | undefined>>({});
// const familyVerified = ref<Record<string, boolean>>({});
// const registrationCreditsRequired = ref<boolean>(true);
// const familyRequired = ref<boolean>(true);

const relayActionOngoing = ref<boolean>(false);

// Fetch the registration credits when the relays are loaded
watch(allRelays, fetchRegistrationCredit);

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

// The user's relays
const fingerprints = computed(() => {
  return allRelays.value.map((relay) => relay.fingerprint);
});
const relayAction = async (action: FunctionName, fingerprint: string) => {
  //TODO: Sign the message
  // See: The following resources
  // https://academy.warp.cc/docs/sdk/advanced/plugins/signature
  // https://github.com/brewlabs-code/ator/blob/main/composables/warp-signer.ts
  // https://docs.google.com/document/d/1VLRd2bP96avNZksMwrf8WSDmcAwrcaQpYAd5SUGDhx0/edit?pli=1#heading=h.gtsv79v2cvnl

  // Apply style to the selected row

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
        actionPromise = registry.claim(fingerprint);
        break;

      case 'renounce':
        actionPromise = registry.renounce(fingerprint);
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
          await userStore.getVerifiedRelays();
          await userStore.getClaimableRelays();

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

const getVerifiedItems = (row: RelayRow) => [
  [
    {
      label: 'Renounce',
      icon: 'i-heroicons-trash-20-solid',
      click: () => relayAction('renounce', row.fingerprint),
    },
  ],
];

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

  try {
    const register = useRegistrator();
    await register?.lock(fingerprint, '');

    selectedRow!.class = '';
    selectedRow!.isWorking = false;
    relayActionOngoing.value = false;
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
    const register = useRegistrator();
    const success = await register?.lock(
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
    case 'all':
      return filterUniqueRelays(allRelays.value);
    case 'locked':
      return filterUniqueRelays(
        allRelays.value.filter((relay) =>
          registratorStore.isRelayLocked(relay.fingerprint)
        )
      );
    case 'claimable':
      return claimableRelays.value;
  }
};

const getObservedBandwidth = (fingerprint: string) => {
  return (
    BigNumber(userStore?.relaysMeta?.[fingerprint]?.observed_bandwidth)
      .dividedBy(Math.pow(1024, 2))
      .toFormat(3) + ' MiB/s'
  );
};

const handleUnlockClick = async (fingerprint: string) => {
  if (registratorStore.isRelayLocked(fingerprint)) {
    isUnlocking.value = true;
    const register = useRegistrator();
    try {
      await register?.unlock(fingerprint, BigInt(100 * 1e18));
      // Refresh the relays
      await userStore.createRelayCache();
    } catch (error) {
    } finally {
      isUnlocking.value = false;
    }
  }
};
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
  <div class="-mx-4 sm:-mx-0">
    <UAlert
      v-if="(allRelaysError as any)?.value"
      class="mb-6"
      icon="i-heroicons-exclamation-triangle"
      description="There was an error retrieving relays. We'll load what we can."
      title="Relay error"
      color="red"
      variant="subtle"
    />
    <Tabs :tabs="TABS" @onChange="handleTabChange" />
    <div
      v-for="row in getTableData(currentTab)"
      :key="row.fingerprint"
      class="mb-4 p-4 border rounded border-cyan-500 dark:border-cyan-600"
    >
      <div class="flex justify-between items-center">
        <div class="font-semibold">Nickname</div>
        <div>
          {{ userStore?.relaysMeta?.[row.fingerprint]?.nickname || '-' }}
        </div>
      </div>
      <div class="flex justify-between items-center mt-2">
        <div class="font-semibold">Running</div>
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
      </div>
      <div class="flex justify-between items-center mt-2">
        <div class="font-semibold">Relay Fingerprint</div>
        <FingerprintDisplay :fingerprint="row.fingerprint" />
      </div>

      <div class="flex justify-between items-center mt-2">
        <div class="font-semibold">Observed Bandwidth</div>
        <div>
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
        </div>
      </div>
      <div class="flex justify-between items-center mt-2">
        <div class="font-semibold flex gap-1 justify-center content-center">
          Previous Distribution
          <div class="flex gap-1 items-center">
            <Popover placement="top" :arrow="false">
              <template #content>
                <div
                  class="text-xs font-normal text-gray-600 dark:text-gray-300"
                >
                  The number of tokens earned by this relay in the last
                  distribution period (typically 1-2 hours)
                </div>
              </template>
              <template #trigger>
                <div><Icon name="heroicons:exclamation-circle" /></div>
              </template>
            </Popover>
          </div>
        </div>
        <div>
          <span>
            {{
              facilitatorStore?.distributionPerRelay?.[row.fingerprint] || '-'
            }}

            <Popover placement="left" :arrow="false" mode="hover">
              <template #content>
                <div class="p-1 px-4">
                  <div
                    class="text-xs font-normal text-green-600 dark:text-green-300 mb-2"
                  >
                    <span class="text-gray-800 dark:text-white"
                      >Base Tokens:</span
                    >

                    {{
                      facilitatorStore?.baseTokensPerRelay?.[row.fingerprint] ||
                      '-'
                    }}
                    $ANYONE
                  </div>
                  <div
                    class="text-xs font-normal text-green-600 dark:text-green-300"
                  >
                    <span class="text-gray-800 dark:text-white"
                      >Family Multiplier:</span
                    >
                    {{
                      facilitatorStore?.multipliersPerRelay?.[row.fingerprint]
                        ?.family || '-'
                    }}x
                  </div>
                  <div
                    class="text-xs font-normal text-green-600 dark:text-green-300"
                  >
                    <span class="text-gray-800 dark:text-white"
                      >Region Multiplier:</span
                    >
                    {{
                      facilitatorStore?.multipliersPerRelay?.[row.fingerprint]
                        ?.region || '-'
                    }}x
                  </div>
                  <div
                    class="text-xs font-normal text-cyan-600 dark:text-cyan-300"
                  >
                    <span class="text-gray-800 dark:text-white"
                      >Hardware Bonus:</span
                    >
                    {{
                      facilitatorStore?.bonusesPerRelay?.[row.fingerprint]
                        ?.hardware || '-'
                    }}
                    $ANYONE
                  </div>
                  <div
                    class="text-xs font-normal text-indigo-700 dark:text-violet-300"
                  >
                    <span class="text-gray-800 dark:text-white"
                      >Uptime Bonus:</span
                    >
                    {{
                      facilitatorStore?.bonusesPerRelay?.[row.fingerprint]
                        ?.quality || '-'
                    }}
                    $ANYONE
                  </div>

                  <div
                    class="text-xs font-normal text-stone-700 dark:text-stone-300"
                  >
                    <span class="text-gray-800 dark:text-white"
                      >Last Distribution:</span
                    >
                    {{
                      facilitatorStore?.lastDistributionTimePerRelay?.[
                        row.fingerprint
                      ] || '-'
                    }}
                  </div>
                </div>
                <!-- <div class="text-xs font-normal text-gray-600 dark:text-gray-300">
                <span class="text-gray-800 dark:text-white">Locked:</span> Your
                lock tx is awaiting Arweave confirmation.
              </div> -->
              </template>
              <template #trigger>
                <div class="-mt-6 cursor-context-menu">
                  <Icon name="heroicons:exclamation-circle" />
                </div>
              </template>
            </Popover>
          </span>
        </div>
      </div>
      <div class="flex justify-between items-center mt-2">
        <div class="font-semibold flex gap-1 justify-center content-center">
          Lock Status
          <div class="flex gap-1 items-center">
            <Tooltip
              placement="top"
              arrow
              text="Shows the current lock status of the Registration."
            >
              <Icon name="heroicons:exclamation-circle" class="h-4" />
            </Tooltip>
          </div>
        </div>
        <LockStatusColumn
          :is-locked="lockedRelaysMap[row.fingerprint]"
          :is-hardware="isHardwareResolved?.[row.fingerprint]"
          :is-verified="row.status === 'verified'"
          :is-loading="registratorStore.loading"
        />
      </div>
      <div class="flex justify-between items-center mt-2">
        <div class="font-semibold">Actions</div>
        <RegistrationActionColumn
          v-if="currentTab !== 'locked'"
          :row="row"
          @relay-action="relayAction"
          @on-lock-relay="handleLockRelay"
          :is-locked="
            lockedRelaysMap[row.fingerprint] ||
            row.status === 'verified' ||
            isHardwareResolved?.[row.fingerprint]
          "
          :is-loading="registratorStore.loading"
          :has-registration-credit="relayCredits[row.fingerprint]"
          :registration-credits-required="registrationCreditsRequired ?? false"
          :family-verified="familyVerified[row.fingerprint]"
          :family-required="familyRequired"
          :relay-action-ongoing="relayActionOngoing"
        />
        <UButton
          v-if="currentTab === 'locked'"
          :ui="{ base: 'text-sm' }"
          :class="{
            'cursor-not-allowed':
              (!registratorStore.isUnlockable(row.fingerprint) && isHovered) ||
              isUnlocking,
          }"
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
      </div>
      <div
        class="flex justify-between items-center mt-2"
        v-if="currentTab === 'locked'"
      >
        <div class="font-semibold flex gap-1 justify-center content-center">
          Owner
          <Popover placement="top" :arrow="false">
            <template #content>
              <div class="text-sm font-medium text-cyan-500 mb-3">
                Ownership Status
              </div>
              <div class="text-xs font-normal text-gray-600 dark:text-gray-300">
                <span class="text-gray-800 dark:text-white">Owner:</span>
                This relay belongs to you.
              </div>
              <div class="text-xs font-normal text-gray-600 dark:text-gray-300">
                <span class="text-gray-800 dark:text-white">Others:</span>
                This relay is owned by someone else.
              </div>
            </template>
            <template #trigger>
              <Icon name="heroicons:information-circle" />
            </template>
          </Popover>
        </div>
        <UBadge
          v-if="
            registratorStore.isRelayOwner(
              row.fingerprint,
              userStore.userData.address!
            )
          "
          color="white"
          variant="solid"
        >
          Owner
        </UBadge>
        <UBadge v-else color="cyan" variant="outline"> Others </UBadge>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.status-active,
.status-inactive {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}
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
</style>
