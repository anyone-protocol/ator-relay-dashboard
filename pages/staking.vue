<template>
  <Card>
    <UTabs
      :items="items"
      :ui="{
        list: {
          width: 'w-max',
          background: '',
          marker: {
            background: '',
          },
          tab: {
            base: 'pb-2 px-4 text-white font-medium',
            rounded: 'rounded-none',
            background: '',
            active: 'border-b-2 border-cyan-500',
          },
        },
      }"
    >
      <template v-slot:operators="{ item }">
        <UTable
          :empty-state="{
            icon: 'i-heroicons-circle-stack-20-solid',
            label: 'No operators.',
          }"
          :rows="operators.value as Operator[]"
          v-model="selected"
          @select="select"
          :single-select="true"
        />

        <div class="flex justify-end">
          <form
            @submit.prevent="submitStakeForm"
            class="mt-6 md:mt-0 w-full md:w-auto"
          >
            <div class="text-gray-400 mb-2">Stake selected operator</div>
            <div class="flex flex-col gap-2">
              <UInput
                v-model="stakeAmount"
                color="neutral"
                placeholder="Amount to stake"
                type="number"
                min="0"
              />
              <UButton
                :loading="isSubmitting.value"
                type="submit"
                variant="outline"
                color="cyan"
                class="justify-center text-md"
              >
                {{ isPending ? 'Staking' : 'Stake' }}
              </UButton>
            </div>
          </form>
        </div>
      </template>
      <template #vault="{ item }">
        <p>{{ item.label }}</p>
      </template>
    </UTabs>
  </Card>
</template>

<script lang="ts" setup>
import Card from '~/components/ui-kit/Card.vue';
import {
  useReadContract,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from '@wagmi/vue';
import {
  hodlerAbi,
  tokenAbi,
} from '../assets/contract-artifacts/wagmi-generated';
import { parseEther } from 'viem';

interface Operator {
  operator: `0x${string}`;
  amount: bigint;
}

const { address, isConnected } = useAccount();
const { data: hash, isPending, writeContractAsync } = useWriteContract();
const { isLoading: isConfirming, isSuccess: isConfirmed } =
  useWaitForTransactionReceipt({
    hash,
  });
const toast = useToast();

const CONTRACT_ADDRESS = '0x948B3c65b89DF0B4894ABE91E6D02FE579834F8F';
const OPERATOR_ADDRESS = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

const stakeAmount = ref(0);
const hodlerAddress = computed(() => address.value);
const operators = computed(() => stakesData ?? []);
const isSubmitting = computed(() => isPending || isConfirming);

const {
  data: stakesData,
  isLoading,
  error,
} = useReadContract({
  address: CONTRACT_ADDRESS as `0x${string}`,
  abi: hodlerAbi,
  functionName: 'getStakes',
  args: [hodlerAddress.value as `0x${string}`],
  query: {
    enabled: !!hodlerAddress.value,
  },
});

watch(stakesData, (stakes) => {
  if (stakes) {
    console.log('stakes: ', toRaw(stakes));
  }
});

const { data: tokenAddress } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: hodlerAbi,
  functionName: 'tokenContract',
  query: { enabled: true },
});

const { data: allowance } = useReadContract({
  address: tokenAddress.value as `0x${string}`,
  abi: tokenAbi,
  functionName: 'allowance',
  args: [hodlerAddress.value as `0x${string}`, CONTRACT_ADDRESS],
  query: {
    enabled: !!hodlerAddress.value && !!tokenAddress.value,
  },
});

const items = [
  {
    slot: 'operators',
    label: 'Operators',
  },
  {
    slot: 'vault',
    label: 'Vault',
  },
];

function select(row: Operator) {
  const index = selected.value.findIndex(
    (item) => item.operator === row.operator
  );
  if (index === -1) {
    selected.value = [row];
  } else {
    selected.value = [];
  }
}

// const operators: Operator[] = [
//   {
//     operator: '0x667...953',
//     amount: BigInt(100),
//   },
//   {
//     operator: '0x667...959',
//     amount: BigInt(100),
//   },
// ];

const selected = ref<Operator[]>([]);

const submitStakeForm = async () => {
  if (!isConnected) {
    toast.add({
      title: 'Please connect your wallet',
      color: 'red',
    });
    return;
  }

  if (!stakeAmount.value || Number(stakeAmount.value) <= 0) {
    toast.add({
      title: 'Enter a valid stake amount',
      color: 'red',
    });
    return;
  }

  try {
    console.log('parsing amount...');
    const amount = parseEther(stakeAmount.value.toString());

    if (allowance.value === undefined || allowance.value < amount) {
      console.log('Approving tokens...');
      await writeContractAsync({
        address: tokenAddress.value,
        abi: tokenAbi,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, amount],
      });

      console.log('Approved Hodler contract to spend tokens');
    } else {
      console.log('Sufficient allowance, skipping approval');
    }

    console.log('writing to contract...');
    await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: hodlerAbi,
      functionName: 'stake',
      args: [OPERATOR_ADDRESS, amount],
    });
  } catch (error: any) {
    console.error('StakingError:', error);
    toast.add({
      title: 'Failed to stake tokens',
      color: 'red',
    });
  }
};

watch(isConfirmed, (confirmed) => {
  if (confirmed) {
    toast.add({
      title: `Staked ${stakeAmount.value} tokens with operator`,
      color: 'green',
    });
    stakeAmount.value = 0;
  }
});
</script>
