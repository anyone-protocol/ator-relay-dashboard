import { formatEther } from 'viem';
import { useAccount } from '@wagmi/vue';
import { getBalance } from '@wagmi/core';
import { type GetBalanceReturnType } from '@wagmi/core';
import type { RelayMeta } from '@/types/relay';

import { useNickNameCache } from '~/composables/nicknameCache';

import {
  warpRead,
  warpReadSerials,
  readNickNames,
  getAllRelays,
} from '@/utils/warp.read';
import { config } from '@/config/wagmi.config';
import { getAnonAddress } from '@/config/web3modal.config';
import type { RelayRow } from '@/types/relay';
import { getRelaysInfo } from '@/utils/relays';
import { toDisplayString } from 'vue';
import { useRelayCache } from '~/composables/relayCache';

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
    nickNames: {} as Record<string, string>,
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
      console.log(
        this.tokenBalance,
        'tokenBalance',
        token,
        'token',
        this.userData.address,
        'userAddress'
      );
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
    async getVerifiedRelays(forceRefresh = false) {
      if (!this.userData.address) {
        this.verifiedRelays = [];
        return;
      }

      const relayCache = useRelayCache();
      console.log('Fetching verified relays from cache');
      const cachedData = await relayCache.getRelayData();
      if (cachedData) {
        console.log('Using cached verified relays');
        console.log(cachedData);
        this.verifiedRelays = cachedData.data.verified;
        return;
      } else {
        // build cache
        await this.createRelayCache();
      }
    },
    async getClaimableRelays() {
      if (!this.userData.address) {
        this.claimableRelays = [];
        return;
      }

      const relayCache = useRelayCache();
      console.log('Fetching claimable relays from cache');
      const cachedData = await relayCache.getRelayData();
      if (cachedData) {
        console.log('Using cached claimable relays');
        this.claimableRelays = cachedData.data.claimable;
        return;
      } else {
        // build cache
        await this.createRelayCache();
      }
    },
    async createRelayCache() {
      if (!this.userData.address) {
      } else {
        var data = await getAllRelays(this.userData.address);
        if (!data) {
          console.log('Failed to get relays');
          return;
        }

        console.log(data);

        this.nickNames = data.data.nicknames;
        this.verifiedRelays = data.data.verified as any;
        this.claimableRelays = data.data.claimable as any;

        // save to cache
        const relayCache = useRelayCache();
        await relayCache.saveRelayData(data);
      }
    },
    async clearCache() {
      const relayCache = useRelayCache();
      this.verifiedRelays = [];
      this.claimableRelays = [];
      this.nickNames = {};
      await relayCache.clearCache();
    },
    async getRelaysMeta() {},
    async getSerialsRelays(forceRefresh = false) {
      if (!this.userData.address) {
        this.serials = [];
        return;
      }

      const relayCache = useRelayCache();
      if (!forceRefresh) {
        const cachedData = await relayCache.getRelayData();
        if (cachedData) {
          return null;
        }
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
