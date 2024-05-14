<script lang="ts" setup>
import { useAccount } from "use-wagmi";
import type { RelayRow } from "@/stores/useUserStore"
import type { FunctionName } from "@/utils/warp.write";
import { useRelayRegistry } from "@/composables/relay-registry";
import { config } from "@/config/wagmi.config";

const toast = useToast();
const userStore = useUserStore();
const registry = useRelayRegistry();
const metricsStore = useMetricsStore();
const { transactionId } = storeToRefs(metricsStore);
const { allRelays } = storeToRefs(userStore);
const { address } = useAccount({config});

// Fetching and refreshing the relay data from Warp - stored in Pinia user store
const { refresh: verifiedRelaysRefresh, error: verifiedRelaysError, pending: verifiedPending } = await useAsyncData(
  "verifiedRelays", () => userStore.getVerifiedRelays().then(() => true), { server: false, watch: [address] }
);
const { refresh: claimableRelaysRefresh, error: claimableRelaysError, pending: claimablePending } = await useAsyncData(
  "claimableRelays", () => userStore.getClaimableRelays().then(() => true), { watch: [address] }
);

// Once there is a transaction ID from the user store, fetch the relay meta
type RelayMetricResult =
  | "OK"
  | "Failed"
  | "NotRegistered"
  | "AlreadyVerified";

type RelayMeta = {
  running: boolean;
  fingerprint: string;
  ator_address: string;
  consensus_weight: number;
  observed_bandwidth: number;
  consensus_weight_fraction: number;
}

type RelayMetric = {
  result: RelayMetricResult;
  relay: RelayMeta;
}

// The user's relays
const fingerprints = computed(() => {
  return allRelays.value.map((relay) => relay.fingerprint);
});

// Get the associated relay/metrics Arweave transaction
// See: stores\useMetricsStore.ts
const { data: relayMeta, error: relayMetaError, pending: relayMetaPending } = await useAsyncData(
  "relayMeta", () => $fetch(`https://arweave.net/${transactionId.value}`).then(response => response as RelayMetric[]),
  {
    server: false,
    watch: [transactionId, fingerprints],
    // Only return the relay data for the fingerprints
    transform: (relayMeta) => {
      const trimmedResults = relayMeta.filter((item) => fingerprints.value.includes(item.relay.fingerprint));

      const structuredResults = trimmedResults.map((item) => {
        return {
          active: item.relay.running,
          status: 'verified',
          fingerprint: item.relay.fingerprint,
          consensusWeight: item.relay.consensus_weight,
          observedBandwidth: item.relay.observed_bandwidth,
        }
      });
      return structuredResults;
    }
  }
);

const relayAction = async (action: FunctionName, fingerprint: string) => {
  //TODO: Sign the message
  // See: The following resources
  // https://academy.warp.cc/docs/sdk/advanced/plugins/signature
  // https://github.com/brewlabs-code/ator/blob/main/composables/warp-signer.ts
  // https://docs.google.com/document/d/1VLRd2bP96avNZksMwrf8WSDmcAwrcaQpYAd5SUGDhx0/edit?pli=1#heading=h.gtsv79v2cvnl

  const verb = {
    claim: {
      pastTense: 'claimed',
      presentTense: 'claiming',
    },
    renounce: {
      pastTense: 'renounced',
      presentTense: 'renouncing',
    },
    register: {
      pastTense: 'registered',
      presentTense: 'registering',
    }
  };

  // Apply style to the selected row
  const selectedRow = allRelays.value.find((row) => row.fingerprint === fingerprint);
  selectedRow!.isWorking = true;
  selectedRow!.class = 'animate-pulse bg-green-100 dark:bg-zinc-600';

  try {
    switch (action) {
      case 'claim':
        await registry.claim(fingerprint);
        break;
      case 'renounce':
        await registry.renounce(fingerprint);
        break;
    }

    // Refresh the relays
    await verifiedRelaysRefresh();
    await claimableRelaysRefresh();

    toast.add({
      icon: "i-heroicons-check-circle",
      color: "primary",
      title: "Success",
      description: `Successfully ${verb[action].pastTense} relay ${truncatedAddress(fingerprint)}!`,
    });

  } catch (error) {
    toast.add({
      icon: "i-heroicons-x-circle",
      color: "amber",
      title: "Error",
      description: `Error ${verb[action].presentTense} relay ${truncatedAddress(fingerprint)}!`,
    });
  };

  selectedRow!.class = '';
  selectedRow!.isWorking = false;
}

// Table columns and actions
const columns = [{
  key: 'fingerprint',
  label: 'Relay fingerprint'
}, {
  key: 'status',
  label: 'Status'
},
{
  key: 'consensusWeight',
  label: 'Consensus weight'
},
{
  key: 'observedBandwidth',
  label: 'Observed bandwidth'
},
{
  key: "active",
  label: "Active"
},
{
  key: 'actions',
}]

const actionItemsVerified = (row: RelayRow) => [
  [
    {
      label: 'Redeem rewards',
      icon: 'i-heroicons-banknotes-20-solid',
      click: () => relayAction('claim', row.fingerprint),
    }], [{
      label: 'Renounce',
      icon: 'i-heroicons-trash-20-solid',
      click: () => relayAction('renounce', row.fingerprint),
    }]
]
</script>

<template>
  <div class="-mx-4 sm:-mx-0">

    <UAlert v-if="verifiedRelaysError || claimableRelaysError" class="mb-6" icon="i-heroicons-exclamation-triangle"
      description="There was an error retrieving relays. We'll load what we can." title="Relay error" color="red"
      variant="subtle" />

    <UTable :loading="verifiedPending || claimablePending" :columns="columns" :rows="allRelays"
      :ui="{ td: { base: 'max-w-sm truncate' } }"
      :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: 'No pending claimable or verified relays!' }">
      <template #actions-data="{ row }">
        <Icon v-if="row.isWorking" name="heroicons:arrow-path-20-solid" class="h-6 w-6 animate-spin" />
        <UDropdown v-if="row.status === 'verified' && !row.isWorking" :items="actionItemsVerified(row)"
          :popper="{ placement: 'left-end' }">
          <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
        </UDropdown>
      </template>
      <template #status-data="{ row }">
        <UBadge v-if="row.status === 'verified'" color="cyan" variant="outline">claimed</UBadge>
        <UButton v-if="row.status === 'claimable'" color="amber" variant="solid" size="2xs" @click="relayAction('claim', row.fingerprint)">Claim</UButton>
      </template>
      <template #consensusWeight-data="{ row }">
        <USkeleton v-if="relayMetaPending" class="h-6 w-full" />
        <span v-if="!relayMetaPending">
          {{ relayMeta?.find((item) => item.fingerprint === row.fingerprint)?.consensusWeight }}
        </span>
        <span
          v-if="!relayMetaPending && !relayMeta?.find((item) => item.fingerprint === row.fingerprint) || relayMetaError"
          class="text-sm flex items-center gap-2">
          <Icon name="heroicons:exclamation-circle" class="h-4 w-4 text-red-500" />Unable to fetch
        </span>
      </template>
      <template #observedBandwidth-data="{ row }">
        <USkeleton v-if="relayMetaPending" class="h-6 w-full" />
        <span v-if="!relayMetaPending">
          {{ relayMeta?.find((item) => item.fingerprint === row.fingerprint)?.observedBandwidth }}
        </span>
        <span
          v-if="!relayMetaPending && !relayMeta?.find((item) => item.fingerprint === row.fingerprint) || relayMetaError"
          class="text-sm flex items-center gap-2">
          <Icon name="heroicons:exclamation-circle" class="h-4 w-4 text-red-500" />Unable to fetch
        </span>
      </template>
      <template #active-data="{ row }">
        <USkeleton v-if="relayMetaPending" class="h-6 w-full" />
        <span v-if="!relayMetaPending">
          {{ relayMeta?.find((item) => item.fingerprint === row.fingerprint)?.active ? 'Running' : 'Inactive' }}
        </span>
      </template>
    </UTable>
  </div>
</template>
