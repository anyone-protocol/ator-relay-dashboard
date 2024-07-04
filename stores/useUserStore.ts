import { formatEther } from 'viem';
import { useAccount } from '@wagmi/vue';
import { getBalance } from '@wagmi/core';
import { type GetBalanceReturnType } from '@wagmi/core';
import type { RelayMeta } from '@/types/relay';

import { warpRead, warpReadSerials } from '@/utils/warp.read';
import { config } from '@/config/wagmi.config';
import { getAnonAddress } from '@/config/web3modal.config';
import type { RelayRow } from '@/types/relay';
import { getRelaysInfo } from '@/utils/relays';
import { toDisplayString } from 'vue';

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
    relaysMeta: {} as Record<string, RelayMeta>,
    claimableRewards: 0,
    claimedRewardsTotal: 0,
    serials: [] as string[],
  }),
  actions: {
    // Get ANON balance
    async getTokenBalance() {
      if (!this.userData.address) {
        return;
      }
      const token = getAnonAddress() as `0x${string}`;

      this.tokenBalance = await getBalance(config, {
        token,
        address: this.userData.address as `0x${string}`,
      });
    },
    // Get ANON balance in USD using price store
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
      if (verified.status === 200) {
        const relays = await verified.json();
        this.verifiedRelays = relays.relays;
        const meta = getRelaysInfo(
          relays.relays.map((relay: { fingerprint: any }) => relay.fingerprint)
        );
        this.relaysMeta = {
          ...this.relaysMeta,
          ...meta,
        };
      } else if (verified.status === 500) {
        this.verifiedRelays = [];
        throw new Error('rate limited');
      }
    },
    // Get claimable relays using Warp
    async getClaimableRelays() {
      if (!this.userData.address) {
        this.claimableRelays = [];
        return;
      }

      const claimable = await warpRead(this.userData.address, 'claimable');

      // make this keep retrying until it gets a 200 status
      if (claimable.status === 200) {
        const relays = await claimable.json();
        this.claimableRelays = relays.relays;
        const meta = await getRelaysInfo(
          relays.relays.map((relay: { fingerprint: any }) => relay.fingerprint)
        );
        this.relaysMeta = {
          ...this.relaysMeta,
          ...meta,
        };
      } else if (claimable.status === 500) {
        this.claimableRelays = [];
        throw new Error('rate limited');
      }
    },
    async claimRelayRefresh() {
      var error = true;
      const toast = useToast();
      // keep trying until it gets a 200 status
      while (error) {
        try {
          await this.getClaimableRelays();
          error = false;
          toast.remove('claimable-relays-error');
        } catch (e) {
          await new Promise((resolve) => setTimeout(resolve, 15000));
        }
      }
    },
    async verifiedRelaysRefresh() {
      var error = true;
      const toast = useToast();
      // keep trying until it gets a 200 status
      while (error) {
        try {
          await this.getVerifiedRelays();
          error = false;
          toast.remove('verified-relays-error');
        } catch (e) {
          await new Promise((resolve) => setTimeout(resolve, 15000));
        }
      }
    },
    async getRelaysMeta() {},
    async getSerialsRelays() {
      if (!this.userData.address) {
        this.serials = [];
        return;
      }

      const serials = await warpReadSerials(this.userData.address);

      this.serials = serials;
    },
    isHardwareRelay(fingerprint: string) {
      return this.serials.includes(fingerprint);
    },
  },
  getters: {
    // Check if the user has any claimable rewards
    hasClaimableRewards: (state) => state.claimableRewards > 0,
    // All relays, verified and claimable
    allRelays: (state) => [...state.verifiedRelays, ...state.claimableRelays],
  },
});
