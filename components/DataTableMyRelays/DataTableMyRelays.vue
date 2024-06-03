<script lang="ts" setup>
import { useAccount } from 'use-wagmi';
import type { FunctionName } from '@/utils/warp.write';
import { useRelayRegistry } from '@/composables/relay-registry';
import { config } from '@/config/wagmi.config';
import { type RelayMetric, type RelayRow } from '@/types/relay';
import { RELAY_COLUMS, TABS, VERBS } from '@/constants/relay';

import Tabs from '../ui-kit/Tabs.vue';
import Tooltip from '../ui-kit/Tooltip.vue';
import Popover from '../ui-kit/Popover.vue';

import LockStatusColumn from './columns/LockStatusColumn.vue';
import RegistrationActionColumn from './columns/RegistrationActionColumn.vue';
import { useRegistrator } from '@/composables/registrator';

const toast = useToast();
const userStore = useUserStore();
const registry = useRelayRegistry();
const metricsStore = useMetricsStore();
const { transactionId } = storeToRefs(metricsStore);
const { allRelays, claimableRelays } = storeToRefs(userStore);
const { address } = useAccount({ config });
const currentTab = ref('all');

// Fetching and refreshing the relay data from Warp - stored in Pinia user store
const {
  refresh: verifiedRelaysRefresh,
  error: verifiedRelaysError,
  pending: verifiedPending,
} = await useAsyncData(
  'verifiedRelays',
  () => userStore.getVerifiedRelays().then(() => true),
  { server: false, watch: [address] }
);
const {
  refresh: claimableRelaysRefresh,
  error: claimableRelaysError,
  pending: claimablePending,
} = await useAsyncData(
  'claimableRelays',
  () => userStore.getClaimableRelays().then(() => true),
  { watch: [address] }
);

// The user's relays
const fingerprints = computed(() => {
  return allRelays.value.map((relay) => relay.fingerprint);
});

// Get the associated relay/metrics Arweave transaction
// See: stores\useMetricsStore.ts
const {
  data: relayMeta,
  error: relayMetaError,
  pending: relayMetaPending,
} = await useAsyncData(
  'relayMeta',
  () =>
    $fetch(`https://arweave.net/${transactionId.value}`).then(
      (response) => response as RelayMetric[]
    ),
  {
    server: false,
    watch: [transactionId, fingerprints],
    // Only return the relay data for the fingerprints
    transform: (relayMeta) => {
      const trimmedResults = relayMeta.filter((item) =>
        fingerprints.value.includes(item.relay.fingerprint)
      );

      const structuredResults = trimmedResults.reduce(
        (acc, item) => {
          acc[item.relay.fingerprint] = {
            nickname: item.relay.nickname || '-',
            active: item.relay.running,
            status: item.relay.status || 'verified',
            fingerprint: item.relay.fingerprint,
            consensusWeight: item.relay.consensus_weight,
            observedBandwidth: item.relay.observed_bandwidth,
          };
          return acc;
        },
        {} as Record<string, RelayRow>
      );
      return structuredResults;
    },
  }
);

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
  selectedRow!.class = 'animate-pulse bg-green-100 dark:bg-zinc-600';

  try {
    switch (action) {
      case 'claim': {
        // const res = await registry.claim(fingerprint);

        // if (!res) {
        //   selectedRow!.class = '';
        //   selectedRow!.isWorking = false;
        //   return;
        // }
        const register = useRegistrator();
        register?.lock(fingerprint);
        break;
      }

      case 'renounce':
        await registry.renounce(fingerprint);
        break;
    }

    // Refresh the relays
    await verifiedRelaysRefresh();
    await claimableRelaysRefresh();

    toast.add({
      icon: 'i-heroicons-check-circle',
      color: 'primary',
      title: 'Success',
      description: `Successfully ${
        VERBS[action].pastTense
      } relay ${truncatedAddress(fingerprint)}!`,
    });
  } catch (error) {
    // @ts-ignore
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
  }

  selectedRow!.class = '';
  selectedRow!.isWorking = false;
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

const handleTabChange = (key: string) => {
  currentTab.value = key;
};
</script>

<template>
  <div class="-mx-4 sm:-mx-0">
    <UAlert
      v-if="verifiedRelaysError || claimableRelaysError"
      class="mb-6"
      icon="i-heroicons-exclamation-triangle"
      description="There was an error retrieving relays. We'll load what we can."
      title="Relay error"
      color="red"
      variant="subtle"
    />

    <Tabs :tabs="TABS" @onChange="handleTabChange" />

    <UTable
      :loading="verifiedPending || claimablePending"
      :columns="RELAY_COLUMS"
      :rows="currentTab === 'claimable' ? claimableRelays : allRelays"
      :ui="{ td: { base: 'max-w-sm truncate' } }"
      :empty-state="{
        icon: 'i-heroicons-circle-stack-20-solid',
        label:
          currentTab === 'claimable'
            ? 'No Claimable relays!'
            : 'No pending claimable or verified relays!',
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
            v-if="row.status === 'verified' && !row.isWorking"
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
      <template #nickname-data="{ row }">
        {{ relayMeta?.[row.fingerprint]?.nickname || '-' }}
      </template>

      <template #active-data="{ row }">
        <USkeleton v-if="relayMetaPending" class="h-6 w-full" />
        <div
          v-if="!relayMetaPending"
          :class="
            relayMeta?.[row.fingerprint]?.active
              ? 'status-active'
              : 'status-inactive'
          "
        ></div>
      </template>

      <template #lockStatus-header="{ column }">
        <div class="flex gap-1 items-center">
          <span>{{ column.label }}</span>
          <Tooltip
            placement="top"
            arrow
            text="Shows the current lock status and amount of locked tokens needed for Registration."
          >
            <Icon name="heroicons:exclamation-circle" class="h-4" />
          </Tooltip>
        </div>
      </template>
      <template #lockStatus-data="{ row }">
        <LockStatusColumn
          :status="row.status === 'verified' ? 'locked' : 'lock-required'"
        />
      </template>

      <template #consensusWeight-data="{ row }">
        <USkeleton v-if="relayMetaPending" class="h-6 w-full" />
        <span v-if="!relayMetaPending">
          {{ relayMeta?.[row.fingerprint]?.consensusWeight }}
        </span>
        <span
          v-if="
            (!relayMetaPending && !relayMeta?.[row.fingerprint]) ||
            relayMetaError
          "
          class="text-sm flex items-center gap-2"
        >
          <Icon
            name="heroicons:exclamation-circle"
            class="h-4 w-4 text-red-500"
          />
          Unable to fetch
        </span>
      </template>
      <template #observedBandwidth-data="{ row }">
        <USkeleton v-if="relayMetaPending" class="h-6 w-full" />
        <span v-if="!relayMetaPending">
          {{ relayMeta?.[row.fingerprint]?.observedBandwidth }}
        </span>
        <span
          v-if="
            (!relayMetaPending && !relayMeta?.[row.fingerprint]) ||
            relayMetaError
          "
          class="text-sm flex items-center gap-2"
        >
          <Icon
            name="heroicons:exclamation-circle"
            class="h-4 w-4 text-red-500"
          />
          Unable to fetch
        </span>
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
            </template>
            <template #trigger>
              <div><Icon name="heroicons:exclamation-circle" /></div>
            </template>
          </Popover>
        </div>
      </template>
      <template #status-data="{ row }">
        <RegistrationActionColumn :row="row" @relayAction="relayAction" />
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
</style>
