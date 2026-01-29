import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useAccount, useConfig } from '@wagmi/vue';
import { useOperatorRegistry } from '~/composables/operator-registry';
import { useUserStore } from '~/stores/useUserStore';
import { hodlerAbi } from '~/assets/abi/hodler';
import { tokenAbi } from '~/assets/abi/token';
import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
} from '@wagmi/core';
import BigNumber from 'bignumber.js';

export const useRelayMutations = () => {
  const config = useConfig();
  const queryClient = useQueryClient();
  const operatorRegistry = useOperatorRegistry();
  const userStore = useUserStore();
  const { address } = useAccount();
  const runtimeConfig = useRuntimeConfig();
  const hodlerContract = runtimeConfig.public.hodlerContract as `0x${string}`;
  const tokenContract =
    runtimeConfig.public.phase === 'live'
      ? (runtimeConfig.public.atorTokenContract as `0x${string}`)
      : (runtimeConfig.public.sepoliaAtorTokenContract as `0x${string}`);

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

      const hodlerInfo = await readContract(config, {
        address: hodlerContract,
        abi: hodlerAbi,
        functionName: 'hodlers',
        args: [address.value as `0x${string}`],
      });
      const available = new BigNumber(
        hodlerInfo ? hodlerInfo[0].toString() : '0'
      );

      // only approve if lock size exceeds available balance in contract
      if (new BigNumber(lockSize.toString()).gt(available)) {
        const currentAllowance = await readContract(config, {
          address: tokenContract,
          abi: tokenAbi,
          functionName: 'allowance',
          args: [address.value as `0x${string}`, hodlerContract],
        });

        // Approve token (only if needed)
        if (
          currentAllowance === undefined ||
          new BigNumber(currentAllowance.toString()).lt(lockSize.toString())
        ) {
          toast.add({
            icon: 'i-heroicons-clock',
            color: 'primary',
            id: 'approve-token',
            timeout: 0,
            title: 'Approving token...',
            closeButton: undefined,
          });

          try {
            const approveHash = await writeContract(config, {
              address: tokenContract,
              abi: tokenAbi,
              functionName: 'approve',
              args: [hodlerContract, lockSize],
            });

            await waitForTransactionReceipt(config, {
              hash: approveHash,
              timeout: 60_000,
            });

            toast.remove('approve-token');
            toast.add({
              icon: 'i-heroicons-check-circle',
              id: 'token-approved',
              color: 'primary',
              title:
                'Token approved! Please accept the transaction to lock the relay.',
            });
          } catch (error: any) {
            toast.remove('approve-token');
            throw error;
          }
        }
      }

      const operator = ethAddress || address.value;

      try {
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

        await waitForTransactionReceipt(config, {
          hash: lockHash,
          timeout: 60_000,
        });

        toast.remove('lock-relay');

        return lockHash;
      } catch (error: any) {
        toast.remove('token-approved');
        toast.remove('lock-relay');
        throw error;
      }
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
      const toast = useToast();
      // Clean up any remaining toasts
      toast.remove('approve-token');
      toast.remove('token-approved');
      toast.remove('lock-relay');
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
