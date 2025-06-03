<template>
  <div class="flex flex-col border-l-2 border-cyan-600 pl-3">
    <div class="flex items-center gap-1">
      <h3 class="text-xs">Redeemable Rewards</h3>
      <Popover
        placement="left"
        :arrow="false"
        class="h-max grid place-items-center"
      >
        <template #content>
          <span class="text-xs font-normal">
            Total amount of tokens that are redeemable across vaults.
          </span>
        </template>
        <template #trigger>
          <Icon name="heroicons:exclamation-circle" class="" />
        </template>
      </Popover>
    </div>
    <div class="inline-flex items-baseline gap-2">
      <template v-if="claimableRewardsPending">
        <USkeleton class="w-[8rem] h-6" />
      </template>
      <template v-else>
        <div class="flex items-center gap-3">
          <div class="flex flex-col">
            <span class="text-xl">
              <template v-if="isConnected">
                {{ formatEtherNoRound(claimableRewards || '0') }}
              </template>
              <template v-else>--</template>
            </span>
            <Ticker class="text-[9px] leading-tight" />
          </div>
          <UButton
            :disabled="!isConnected || Number(claimableRewards) <= 0"
            @click="claimStakingRewardsMutation()"
            variant="outline"
            color="cyan"
            size="2xs"
            :loading="claimStakingRewardsPending"
          >
            Redeem
          </UButton>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useMutation, useQuery } from '@tanstack/vue-query';
import { useAccount } from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import Card from './ui-kit/Card.vue';

const { isConnected, address } = useAccount({ config } as any);

const toast = useToast();
const { getTotalClaimableStakingRewards, claimStakingRewards } =
  useStakingRewards();

const { data: claimableRewards, isPending: claimableRewardsPending } = useQuery(
  {
    queryKey: ['claimableRewards', address],
    queryFn: async () => {
      if (!address.value) return '0';

      return getTotalClaimableStakingRewards(address.value);
    },
    enabled: !!address.value,
  }
);

const {
  mutate: claimStakingRewardsMutation,
  data: claimStakingRewardsResult,
  isPending: claimStakingRewardsPending,
  isSuccess: claimStakingRewardsSuccess,
  isError: claimStakingRewardsError,
} = useMutation({
  mutationFn: async () => {
    if (!address.value) {
      toast.add({
        title: 'Please connect wallet to claim',
        color: 'red',
      });
      return;
    }

    return claimStakingRewards(address.value);
  },
});

watch([claimStakingRewardsSuccess, claimStakingRewardsError], () => {
  if (claimStakingRewardsError) {
    toast.add({
      title: 'Failed to claim staking rewards',
      color: 'red',
    });
  }

  // TODO - need to do more robust check here
  if (claimStakingRewardsSuccess) {
    toast.add({
      title: `Successfully claimed ${claimableRewards.value} tokens`,
      color: 'green',
    });
    claimableRewards.value = '0';
  }
});
</script>
