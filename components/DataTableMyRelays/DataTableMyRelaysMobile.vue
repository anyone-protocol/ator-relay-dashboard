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
        registrator.getLokedRelaysTokens(userStore.userData.address);
      }
    }
  }, 1000 * 60);
});

// watch for all relays change and update the relay credits

const unwatch = watchAccount(config, {
  onChange(account) {
    // account change
    userStore.createRelayCache();
    fetchRegistrationCredit();
  },
});
unwatch();

// Fetching and refreshing the relay data from Warp - stored in Pinia user store
const { error: allRelaysError, pending: allRelaysPending } = await useAsyncData(
  'verifiedRelays',
  () => userStore.createRelayCache(),
  {
    server: false,
    watch: [address],
  }
);
const { error: claimableRelaysError, pending: claimablePending } =
  await useAsyncData('claimableRelays', () => userStore.getClaimableRelays(), {
    watch: [address],
  });

const { error: verifiedRelaysError, pending: verifiedPending } =
  await useAsyncData('verifiedRelays', () => userStore.getVerifiedRelays(), {
    server: false,
    watch: [address],
  });

const ethAddress = ref<string>('');
const ethAddressError = ref<string | null>(null);
const fingerPrintRegister = ref<string>('');
const fingerPrintRegisterError = ref<string | null>(null);

const relayCredits = ref<Record<string, boolean | undefined>>({});
const familyVerified = ref<Record<string, boolean>>({});
const registrationCreditsRequired = ref<boolean>(true);
const familyRequired = ref<boolean>(true);

const fetchRegistrationCredit = async () => {
  if (allRelays.value) {
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
      .then((res) => {
        if (!res) {
          selectedRow!.class = '';
          selectedRow!.isWorking = false;
          return;
        }

        // Refresh the relays cache
        return userStore
          .createRelayCache()
          .then(() => userStore.getVerifiedRelays())
          .then(() => userStore.getClaimableRelays())
          .then(() => {
            toast.add({
              icon: 'i-heroicons-check-circle',
              color: 'primary',
              title: 'Success',
              timeout: 0,
              description: `Successfully ${
                VERBS[action].pastTense
              } relay ${truncatedAddress(fingerprint)}!`,
            });
          });
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
      });
  } catch (error) {
    selectedRow!.class = '';
    selectedRow!.isWorking = false;
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
  selectedRow!.class = 'animate-pulse bg-green-100 dark:bg-zinc-600';

  try {
    const register = useRegistrator();
    await register?.lock(fingerprint, '');

    selectedRow!.class = '';
    selectedRow!.isWorking = false;
  } catch {
    selectedRow!.class = '';
    selectedRow!.isWorking = false;
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
      v-if="
        (allRelaysError as any)?.value || (claimableRelaysError as any)?.value
      "
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
            :class="
              userStore?.relaysMeta?.[row.fingerprint]?.running
                ? 'status-active'
                : 'status-inactive'
            "
          ></span>
        </div>
      </div>
      <div class="flex justify-between items-center mt-2">
        <div class="font-semibold">Relay Fingerprint</div>
        <FingerprintDisplay :fingerprint="row.fingerprint" />
      </div>
      <div class="flex justify-between items-center mt-2">
        <div class="font-semibold">Consensus Weight</div>
        <div>
          <span
            v-if="
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
        </div>
      </div>
      <div class="flex justify-between items-center mt-2">
        <div class="font-semibold">Observed Bandwidth</div>
        <div>
          <span
            v-if="
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
          Lock Status
          <Tooltip
            placement="top"
            arrow
            text="Shows the current lock status of the Registration."
          >
            <Icon name="heroicons:exclamation-circle" class="h-4" />
          </Tooltip>
        </div>
        <LockStatusColumn
          :is-locked="registratorStore.isRelayLocked(row.fingerprint)"
          :is-hardware="userStore.isHardwareRelay(row.fingerprint)"
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
            registratorStore.isRelayLocked(row.fingerprint) ||
            row.status === 'verified' ||
            userStore.isHardwareRelay(row.fingerprint)
          "
          :is-loading="registratorStore.loading"
          :has-registration-credit="relayCredits[row.fingerprint]"
          :registration-credits-required="registrationCreditsRequired"
          :family-verified="familyVerified[row.fingerprint]"
          :family-required="familyRequired"
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
