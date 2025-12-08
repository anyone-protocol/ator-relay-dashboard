import { useMutation, useQueryClient } from '@tanstack/vue-query';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import { useOperatorRegistry } from '~/composables/operator-registry';
import { useUserStore } from '~/stores/useUserStore';
import { hodlerAbi } from '~/assets/abi/hodler';
import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
} from '@wagmi/core';

export const useRelayMutations = () => {
  const queryClient = useQueryClient();
  const operatorRegistry = useOperatorRegistry();
  const userStore = useUserStore();
  const { address } = useAccount({ config } as any);
  const runtimeConfig = useRuntimeConfig();
  const hodlerContract = runtimeConfig.public.hodlerContract as `0x${string}`;
  const tokenContract = runtimeConfig.public.tokenContractMain as `0x${string}`;

  const lockMutation = useMutation({
    mutationFn: async ({
      fingerprint,
      ethAddress,
    }: {
      fingerprint: string;
      ethAddress: string;
    }) => {
      const toast = useToast();

      if (!address.value) {
        throw new Error('Wallet not connected');
      }

      // Get lock size from contract
      const lockSize = await readContract(config, {
        address: hodlerContract,
        abi: hodlerAbi,
        functionName: 'LOCK_SIZE',
      });

      // Step 1: Approve token
      toast.add({
        icon: 'i-heroicons-clock',
        color: 'primary',
        id: 'approve-token',
        timeout: 0,
        title: 'Approving token...',
        closeButton: undefined,
      });

      const approveHash = await writeContract(config, {
        address: tokenContract,
        abi: [
          {
            name: 'approve',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
            outputs: [{ name: '', type: 'bool' }],
          },
        ],
        functionName: 'approve',
        args: [hodlerContract, lockSize],
      });

      await waitForTransactionReceipt(config, { hash: approveHash });

      toast.remove('approve-token');
      toast.add({
        icon: 'i-heroicons-check-circle',
        id: 'token-approved',
        color: 'primary',
        title:
          'Token approved! Please accept the transaction to lock the relay.',
      });

      // Step 2: Lock
      const operator = ethAddress || address.value;
      const lockHash = await writeContract(config, {
        address: hodlerContract,
        abi: hodlerAbi,
        functionName: 'lock',
        args: [fingerprint, operator as `0x${string}`],
      });

      toast.remove('token-approved');
      toast.add({
        icon: 'i-heroicons-clock',
        color: 'primary',
        id: 'lock-relay',
        timeout: 0,
        title: 'Locking relay...',
        closeButton: undefined,
      });

      await waitForTransactionReceipt(config, { hash: lockHash });
      toast.remove('lock-relay');

      return lockHash;
    },
    onSuccess: () => {
      // Invalidate wagmi contract read queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey[0] === 'readContract';
        },
      });
      // Invalidate custom queries
      queryClient.invalidateQueries({ queryKey: ['relays', address.value] });
      queryClient.invalidateQueries({ queryKey: ['relayMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['lastRound'] });
    },
    onError: (error) => {
      console.error('Lock mutation failed:', error);
    },
  });

  const unlockMutation = useMutation({
    mutationFn: async ({
      fingerprint,
      operator,
    }: {
      fingerprint: string;
      operator: string;
    }) => {
      const toast = useToast();

      if (!address.value) {
        throw new Error('Wallet not connected');
      }

      toast.add({
        icon: 'i-heroicons-clock',
        color: 'primary',
        id: 'unlock-relay',
        timeout: 0,
        title: 'Unlocking relay...',
        closeButton: undefined,
      });

      const unlockHash = await writeContract(config, {
        address: hodlerContract,
        abi: hodlerAbi,
        functionName: 'unlock',
        args: [fingerprint, operator as `0x${string}`],
      });

      await waitForTransactionReceipt(config, { hash: unlockHash });
      toast.remove('unlock-relay');

      return unlockHash;
    },
    onSuccess: () => {
      // Invalidate wagmi contract read queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey[0] === 'readContract';
        },
      });
      // Invalidate custom queries
      queryClient.invalidateQueries({ queryKey: ['relays', address.value] });
      queryClient.invalidateQueries({ queryKey: ['relayMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['lastRound'] });
    },
    onError: (error) => {
      console.error('Unlock mutation failed:', error);
    },
  });

  const claimMutation = useMutation({
    mutationFn: async (fingerprint: string) => {
      return await operatorRegistry.claim(fingerprint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relays', address.value] });
      queryClient.invalidateQueries({ queryKey: ['relayMetrics'] });
    },
    onError: (error) => {
      console.error('Claim mutation failed:', error);
    },
  });

  const renounceMutation = useMutation({
    mutationFn: async (fingerprint: string) => {
      return await operatorRegistry.renounce(fingerprint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relays', address.value] });
      queryClient.invalidateQueries({ queryKey: ['relayMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['lastRound'] });
    },
    onError: (error) => {
      console.error('Renounce mutation failed:', error);
    },
  });

  return {
    lockMutation,
    unlockMutation,
    claimMutation,
    renounceMutation,
  };
};
