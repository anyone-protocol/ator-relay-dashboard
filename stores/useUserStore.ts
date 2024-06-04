import { formatEther } from 'viem';
import { useAccount } from 'use-wagmi';
import { getBalance } from 'use-wagmi/actions';
import { type GetBalanceReturnType } from 'use-wagmi/actions';
import { hardhat } from 'viem/chains';

import { warpRead } from '@/utils/warp.read';
import { config } from '@/config/wagmi.config';
import { getAtorAddress } from '@/config/web3modal.config';
import type { RelayRow } from '@/types/relay';

export const useUserStore = defineStore('user', {
  state: () => ({
    address: null as `0x${string}` | null,
    userData: useAccount({ config }),
    tokenBalance: {
      value: 0n,
      symbol: '',
      decimals: 0,
      formatted: '0',
    } as GetBalanceReturnType,
    tokenBalanceUsd: 0,
    verifiedRelays: [] as RelayRow[],
    claimableRelays: [] as RelayRow[],
    claimableRewards: 0,
    claimedRewardsTotal: 0,
  }),
  actions: {
    // Get ATOR balance
    async getTokenBalance() {
      if (!this.userData.address) {
        return;
      }
      const token = getAtorAddress() as `0x${string}`;

      // TODO: change to sepolia
      this.tokenBalance = await getBalance(config, {
        token,
        address: this.userData.address as `0x${string}`,
        chainId: hardhat.id,
      });
    },
    // Get ATOR balance in USD using price store
    async getUsdTokenBalance() {
      const priceStore = usePriceStore();
      await priceStore.fetchPrice();

      this.tokenBalanceUsd =
        priceStore.currentPrice.data *
        Number(formatEther(this.tokenBalance?.value ?? BigInt(0)));
    },
    // Get verified relays using Warp
    async getVerifiedRelays() {
      if (!this.userData.address) {
        this.verifiedRelays = [];
        return;
      }

      const verified = await warpRead(this.userData.address, 'verified');
      // const serials = await warpRead(this.userData.address, 'serials');

      if (verified.status === 200) {
        const relays = await verified.json();

        this.verifiedRelays = relays.relays;
      }
    },
    // Get claimable relays using Warp
    async getClaimableRelays() {
      if (!this.userData.address) {
        this.claimableRelays = [];
        return;
      }

      const claimable = await warpRead(this.userData.address, 'claimable');

      if (claimable.status === 200) {
        const relays = await claimable.json();
        this.claimableRelays = relays.relays;
      }
    },
  },
  getters: {
    // Check if the user has any claimable rewards
    hasClaimableRewards: (state) => state.claimableRewards > 0,
    // All relays, verified and claimable
    allRelays: (state) => [...state.verifiedRelays, ...state.claimableRelays],
  },
});
