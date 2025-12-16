import { mainnet, sepolia } from 'viem/chains';
import { computed } from 'vue';

export const useDefaultChain = () => {
  const config = useRuntimeConfig();
  const phase = config.public.phase || 'dev';

  return computed(() => (phase === 'live' ? mainnet : sepolia));
};
