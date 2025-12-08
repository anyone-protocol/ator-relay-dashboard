<script lang="ts" setup>
import { useAccount, useReadContract } from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import {
  type RelayMeta,
  type RelayRow,
  type RelayTabType,
} from '@/types/relay';
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
import { hodlerAbi } from '~/assets/abi/hodler';
import { getBlock } from '@wagmi/core';
import { useDebounceFn } from '@vueuse/core';
import { useQueries } from '@tanstack/vue-query';
import type { LastRoundData } from '~/composables/relay-rewards';
import Ticker from '../ui-kit/Ticker.vue';
import { useRelays } from '~/composables/queries/useRelays';
import { useRelayMetrics } from '~/composables/queries/useRelayMetrics';
import { useRelayMutations } from '@/composables/mutations/useRelayMutations';
import {
  useRelayMetricsQueries,
  useHardwareRelaysCountQuery,
} from '~/composables/queries/useRelayQueries';

const props = defineProps<{
  currentTab: RelayTabType;
  registerModalOpen: boolean;
}>();

const toast = useToast();
const userStore = useUserStore();
const metricsStore = useMetricsStore();

const isHovered = ref(false);
const isUnlocking = ref(false);
const workingRelays = ref<Record<string, boolean>>({});
const relayClasses = ref<Record<string, string>>({});

const { address, isConnected } = useAccount({ config } as any);

const {
  data: relaysData,
  isPending: relaysPending,
  isError: relaysErrored,
  error: relaysError,
} = useRelays(computed(() => address.value));

const runtimeConfig = useRuntimeConfig();
const hodlerContract = runtimeConfig.public.hodlerContract as `0x${string}`;

// Fetch locks directly from contract using useReadContract
const {
  data: locksData,
  isPending: locksPending,
  refetch: refetchLocks,
} = useReadContract({
  address: hodlerContract,
  abi: hodlerAbi,
  functionName: 'getLocks',
  args: [computed(() => address.value as `0x${string}`)],
  query: {
    enabled: computed(() => !!address.value),
  },
});

// Transform locks data into a map for easy lookup
const lockedRelaysMap = computed(() => {
  if (!locksData.value) return {};

  const map: Record<string, boolean> = {};
  for (const lock of locksData.value) {
    map[lock.fingerprint as string] = true;
  }
  return map;
});

const allFingerprints = computed(() => {
  const ownedFingerprints = relaysData.value
    ? [...relaysData.value.verified, ...relaysData.value.claimable]
    : [];

  // Include delegated lock fingerprints so we can fetch metrics for them
  const delegatedFingerprints = Object.keys(lockedRelaysMap.value).filter(
    (fp) => !ownedFingerprints.includes(fp)
  );

  return [...ownedFingerprints, ...delegatedFingerprints];
});

const { data: metricsData, isPending: metricsPending } =
  useRelayMetrics(allFingerprints);

const mapMetricsToRow = (metrics: RelayMeta | undefined) => {
  if (!metrics) {
    return {
      consensusWeight: 0,
      observedBandwidth: 0,
      nickname: '',
      active: false,
    };
  }

  return {
    consensusWeight: Number(metrics.consensus_weight) || 0,
    observedBandwidth: metrics.observed_bandwidth || 0,
    nickname: metrics.nickname || '',
    active: metrics.running || false,
  };
};

const allRelays = computed<RelayRow[]>(() => {
  if (!relaysData.value) return [];

  const verified: RelayRow[] = relaysData.value.verified.map((fp) => ({
    fingerprint: fp,
    status: 'verified',
    ...mapMetricsToRow(metricsData.value?.[fp]),
    class: relayClasses.value[fp] || '',
    isWorking: workingRelays.value[fp] || false,
  }));

  const claimable: RelayRow[] = relaysData.value.claimable.map((fp) => ({
    fingerprint: fp,
    status: 'claimable',
    ...mapMetricsToRow(metricsData.value?.[fp]),
    class: relayClasses.value[fp] || '',
    isWorking: workingRelays.value[fp] || false,
  }));

  return [...verified, ...claimable];
});

const claimableRelays = computed<RelayRow[]>(() => {
  if (!relaysData.value) return [];

  return relaysData.value.claimable.map((fp) => ({
    fingerprint: fp,
    status: 'claimable',
    ...mapMetricsToRow(metricsData.value?.[fp]),
    class: '',
    isWorking: false,
  }));
});

// const { allRelays, claimableRelays } = storeToRefs(userStore);

const registerModalOpen = ref(false);

const relayRewardsProcessId = runtimeConfig.public.relayRewardsProcessId;

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

// Fetch hardware status using query-based approach
const { relayInfoQuery, hardwareStatusQuery } = useRelayMetricsQueries(address);

// Hardware status is computed, so isPending comes from relayInfoQuery
const isHardwareResolved = computed(() => hardwareStatusQuery.value || {});

const ethAddress = ref<string>('');
const ethAddressError = ref<string | null>(null);
const fingerPrintRegister = ref<string>('');
const fingerPrintRegisterError = ref<string | null>(null);

const relayActionOngoing = ref<boolean>(false);

if ((relaysError as any).value?.cause?.message == 'rate limited') {
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

const { lockMutation, unlockMutation, claimMutation, renounceMutation } =
  useRelayMutations();

const relayAction = async (
  action: 'claim' | 'renounce',
  fingerprint: string
) => {
  const selectedRow = allRelays.value.find(
    (row) => row.fingerprint === fingerprint
  );
  if (!selectedRow) return;

  selectedRow.isWorking = true;
  relayActionOngoing.value = true;
  selectedRow.class = 'animate-pulse bg-green-100 dark:bg-zinc-600';

  try {
    let result;
    switch (action) {
      case 'claim':
        result = await claimMutation.mutateAsync(fingerprint);
        break;
      case 'renounce':
        result = await renounceMutation.mutateAsync(fingerprint);
        break;
      default:
        throw new Error('Invalid action');
    }

    if (!result) {
      selectedRow.class = '';
      selectedRow.isWorking = false;
      relayActionOngoing.value = false;
      return;
    }

    // Wait a bit for the transaction to process
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const maxRetries = 3;
    let retryCount = 0;

    const checkStatus = async (): Promise<boolean> => {
      retryCount++;

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const index = allRelays.value.findIndex(
        (row) => row.fingerprint === fingerprint
      );

      if (action === 'claim') {
        if (index !== -1 && allRelays.value[index].status === 'verified') {
          return true;
        }
      } else if (action === 'renounce') {
        if (index === -1) {
          return true;
        }
      }

      if (retryCount < maxRetries) {
        return await checkStatus();
      }

      return false;
    };

    const success = await checkStatus();

    if (success) {
      toast.add({
        icon: 'i-heroicons-check-circle',
        color: 'primary',
        title: 'Success',
        timeout: 0,
        description: `Successfully ${
          VERBS[action].pastTense
        } relay ${truncatedAddress(fingerprint)}!`,
      });
    } else {
      toast.add({
        icon: 'i-heroicons-x-circle',
        color: 'amber',
        title: 'Warning',
        description: `Action completed but status update pending. Please refresh.`,
      });
    }
  } catch (error: any) {
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
  } finally {
    selectedRow.class = '';
    selectedRow.isWorking = false;
    relayActionOngoing.value = false;
  }
};

const getVerifiedItems = (row: RelayRow) => {
  // if locked, show unlock and claimed, else show renounce

  const isHardware = isHardwareResolved.value?.[row.fingerprint];
  const isLocked = lockedRelaysMap.value?.[row.fingerprint];
  const isClaimed = row.status === 'verified';
  const skipSideMenu = !isClaimed && !isLocked && !isHardware;

  const items = [];

  if (skipSideMenu) {
    return [[]];
  }

  if (isLocked) {
    items.push({
      label: 'Unlock',
      icon: 'i-heroicons-lock-open-20-solid',
      click: () => handleUnlockRelay(row.fingerprint),
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
  workingRelays.value[fingerprint] = true;
  relayActionOngoing.value = true;
  relayClasses.value[fingerprint] =
    'animate-pulse bg-green-100 dark:bg-zinc-600';

  try {
    await lockMutation.mutateAsync({ fingerprint, ethAddress: '' });

    // Immediately refetch locks to show the new lock in the UI
    await refetchLocks();

    const maxTries = 3;
    let currentTry = 0;

    const checkCredit = async (): Promise<boolean> => {
      currentTry++;

      if (currentTry > maxTries) {
        return false;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000)); // Reduced to 3s fixed delay
      await fetchRegistrationCredit();

      if (relayCredits.value[fingerprint] === false) {
        console.log('Registration credit removed at attempt: ', currentTry);
        return true;
      }

      return await checkCredit();
    };

    await checkCredit();

    toast.add({
      icon: 'i-heroicons-check-circle',
      color: 'primary',
      title: 'Success',
      description: `Successfully locked relay!`,
    });
  } catch (error: any) {
    if (
      error?.message === 'ACTION_REJECTED' ||
      error?.code === 'ACTION_REJECTED' ||
      error?.code === 4001
    ) {
      console.log('User cancelled transaction');
      // Don't show error toast for user cancellation since this is handled in hodler.lock
    } else {
      toast.add({
        icon: 'i-heroicons-x-circle',
        color: 'amber',
        title: 'Error',
        description: `Error locking relay`,
      });
    }
  } finally {
    delete workingRelays.value[fingerprint];
    delete relayClasses.value[fingerprint];
    relayActionOngoing.value = false;
  }
};

// for modal
const handleLockRemote = async () => {
  if (fingerPrintRegisterError.value || ethAddressError.value) {
    return;
  }

  if (fingerPrintRegister.value == '' || ethAddress.value == '') {
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
    await lockMutation.mutateAsync({
      fingerprint: fingerPrintRegister.value,
      ethAddress: ethAddress.value,
    });

    // Immediately refetch locks to show the new lock in the UI
    await refetchLocks();

    registerModalOpen.value = false;

    toast.add({
      icon: 'i-heroicons-check-circle',
      color: 'primary',
      title: 'Success',
      description: `Successfully registered relay!`,
    });
  } catch (error: any) {
    toast.add({
      id: 'invalid-evm-address',
      icon: 'i-heroicons-x-circle',
      color: 'amber',
      title: 'Error',
      description: `Error registering relay`,
    });
  }
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
      return Object.keys(lockedRelaysMap.value).map((fingerprint) => {
        const metrics = metricsData.value?.[fingerprint];
        return {
          fingerprint,
          status: 'locked',
          nickname: metrics?.nickname || '-',
          consensusWeight: Number(metrics?.consensus_weight) || 0,
          observedBandwidth: metrics?.observed_bandwidth || 0,
          active: metrics?.running || false,
          class: relayClasses.value[fingerprint] || '',
          isWorking: workingRelays.value[fingerprint] || false,
        };
      });
    case 'all':
      return filterUniqueRelays(allRelays.value);
    case 'claimable':
      return claimableRelays.value;
    case 'unlocked':
      return vaults.value;
  }
};

const getObservedBandwidth = (row: RelayRow) => {
  return (
    BigNumber(row.observedBandwidth).dividedBy(Math.pow(1024, 2)).toFormat(3) +
    ' MB/s'
  );
};

// console.log();

const handleUnlockRelay = async (fingerprint: string) => {
  isUnlocking.value = true;

  try {
    // Get the operator address from the lock data
    const lock = locksData.value?.find((l) => l.fingerprint === fingerprint);
    if (!lock) {
      throw new Error('Lock not found');
    }

    await unlockMutation.mutateAsync({
      fingerprint,
      operator: lock.operator as string,
    });

    toast.add({
      icon: 'i-heroicons-check-circle',
      color: 'primary',
      title: 'Success',
      description: `Successfully unlocked relay!`,
    });
  } catch (error: any) {
    if (
      error?.message === 'ACTION_REJECTED' ||
      error?.code === 'ACTION_REJECTED' ||
      error?.code === 4001
    ) {
      console.log('User cancelled transaction');
      // Don't show error toast for user cancellation since this is handled in hodler.unlock
    } else {
      toast.add({
        icon: 'i-heroicons-x-circle',
        color: 'amber',
        title: 'Error',
        description: `Error unlocking relay`,
      });
    }
  } finally {
    isUnlocking.value = false;
  }
};

// Get lock details (operator) for ownership check
const getRelayOwner = (fingerprint: string): string | null => {
  if (!locksData.value) return null;
  const lock = locksData.value.find((l) => l.fingerprint === fingerprint);
  return lock ? (lock.operator as string) : null;
};

// Loading state: show skeleton while locks are being fetched
const isLoadingLockStatus = computed(
  () => isConnected.value && locksPending.value
);

const {
  data: vaultsData,
  isPending: vaultsPending,
  refetch: refetchVaults,
} = useReadContract({
  address: hodlerContract,
  abi: hodlerAbi,
  functionName: 'getVaults',
  args: [computed(() => address.value as `0x${string}`)],
  query: {
    enabled: computed(() => isConnected.value),
  },
});

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
      staleTime: 30 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
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

const loadMoreIfNeeded = async () => {
  await nextTick();
  if (!relayTableRef.value) return;
  const wrapper = relayTableRef.value.$el;
  while (
    hasMoreItems.value &&
    wrapper.scrollHeight <= wrapper.clientHeight + 50
  ) {
    visibleItems.value += ITEMS_PER_LOAD;
    await nextTick();
  }
};

const debouncedHandleScroll = useDebounceFn(handleScroll, 200);

watch(
  [allRelays, claimableRelays, props.currentTab, relayTableRef],
  async () => {
    if (import.meta.client && relayTableRef.value) {
      await nextTick(); // Ensure DOM is updated
      visibleItems.value = ITEMS_PER_LOAD; // Reset on tab change
      loadMoreIfNeeded();
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

onMounted(() => {
  window.addEventListener('resize', debouncedLoadMoreIfNeeded);
});
onUnmounted(() => {
  window.removeEventListener('resize', debouncedLoadMoreIfNeeded);
});
const debouncedLoadMoreIfNeeded = useDebounceFn(loadMoreIfNeeded, 200);
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
  <div class="-mx-4 sm:-mx-0 overflow-auto">
    <UAlert
      v-if="relaysErrored"
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
      :loading="currentTab === 'unlocked' ? vaultsPending : relaysPending"
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
                lockedRelaysMap[row.fingerprint] ||
                isHardwareResolved?.[row.fingerprint])
            "
            :items="getVerifiedItems(row)"
            :popper="{ placement: 'left-end' }"
          >
            <UButton
              size="xs"
              variant="ghost"
              icon="i-heroicons-ellipsis-horizontal-20-solid"
              class="bg-neutral-100 hover:bg-neutral-200/50 text-neutral-950 dark:bg-neutral-800 hover:dark:bg-neutral-700/50 dark:text-white"
            />
          </UDropdown>
        </div>
      </template>
      <template #fingerprint-data="{ row }: { row: RelayRow }">
        <span>{{ row.fingerprint }}</span>
      </template>
      <template #nickname-data="{ row }: { row: RelayRow }">
        {{ row.nickname || '-' }}
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
                      lastRound[
                        row.fingerprint
                      ].Details.Variables.FamilyMultiplier.toFixed(2)
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
                      lastRound[
                        row.fingerprint
                      ].Details.Variables.LocationMultiplier.toFixed(2)
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

      <template #active-data="{ row }: { row: RelayRow }">
        <div class="flex items-center">
          <span v-if="row.active === true" class="text-green-500">●</span>
          <span v-else-if="row.active === false" class="text-red-500">●</span>
          <span v-else>-</span>
        </div>
      </template>

      <template #consensusWeight-data="{ row }: { row: RelayRow }">
        <template v-if="metricsPending">
          <USkeleton class="w-[6rem] h-8" />
        </template>
        <span v-else-if="row.consensusWeight !== undefined">
          {{ row.consensusWeight }}
        </span>
        <span v-else class="text-sm flex items-center gap-2">
          <Icon
            name="heroicons:exclamation-circle"
            class="h-4 w-4 text-red-500"
          />
          Unable to fetch
        </span>
      </template>
      <template #observedBandwidth-data="{ row }: { row: RelayRow }">
        <template v-if="metricsPending">
          <USkeleton class="w-[6rem] h-8" />
        </template>
        <span v-else-if="row.observedBandwidth !== undefined">
          {{ getObservedBandwidth(row) }}
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
          :is-hardware="isHardwareResolved[row.fingerprint]"
          :is-verified="row.status === 'verified'"
          :is-loading="isLoadingLockStatus"
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
            isHardwareResolved[row.fingerprint]
          "
          :is-loading="relayInfoQuery.isPending.value"
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
          @click="handleUnlockRelay(row.fingerprint)"
          @mouseover="isHovered = true"
          @mouseleave="isHovered = false"
        />
      </template>
      <template #owner-data="{ row }">
        <UBadge
          v-if="
            getRelayOwner(row.fingerprint)?.toLowerCase() ===
            userStore.userData.address?.toLowerCase()
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
