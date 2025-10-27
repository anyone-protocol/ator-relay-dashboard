import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useAccount } from '@wagmi/vue';
import { config } from '@/config/wagmi.config';
import { useOperatorRegistry } from '~/composables/operator-registry';
import { useHodler } from '~/composables/hodler';
import { useUserStore } from '~/stores/useUserStore';

export const useRelayMutations = () => {
  const queryClient = useQueryClient();
  const operatorRegistry = useOperatorRegistry();
  const hodler = useHodler();
  const userStore = useUserStore();
  const { address } = useAccount({ config } as any);

  const lockMutation = useMutation({
    mutationFn: async ({
      fingerprint,
      ethAddress,
    }: {
      fingerprint: string;
      ethAddress: string;
    }) => {
      if (!hodler) {
        throw new Error('Hodler not available');
      }
      return await hodler.lock(fingerprint, ethAddress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relays', address.value] });
      queryClient.invalidateQueries({ queryKey: ['relayMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['lastRound'] });
    },
    onError: (error) => {
      console.error('Lock mutation failed:', error);
    },
  });

  const unlockMutation = useMutation({
    mutationFn: async (fingerprint: string) => {
      if (!hodler) {
        throw new Error('Hodler not available');
      }
      if (!userStore.userData.address) {
        throw new Error('User address not available');
      }
      return await hodler.unlock(fingerprint, userStore.userData.address);
    },
    onSuccess: () => {
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
