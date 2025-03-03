import { formatEther } from 'viem';
import { useAccount } from '@wagmi/vue';
import { getBalance } from '@wagmi/core';
import { type GetBalanceReturnType } from '@wagmi/core';
import type { RelayMeta } from '@/types/relay';
import { config } from '@/config/wagmi.config';
import { getAnonAddressMain } from '@/config/web3modal.config';
import type { RelayRow } from '@/types/relay';
import { useRelayCache } from '~/composables/relayCache';
import { mainnet } from 'viem/chains';

type CacheData = {
  tokenBalance: number;
  tokenBalanceUsd: number;
};

const nuxtConfig = useRuntimeConfig();

export const useUserStore = defineStore('user', {
  state: () => ({
    address: null as `0x${string}` | null,
    userData: useAccount({ config } as any),
    tokenBalance: {
      value: 0n,
      symbol: '',
      decimals: 0,
      formatted: '0',
    } as GetBalanceReturnType,
    tokenBalanceUsd: 0,
    cacheTimings: {} as CacheData,
    verifiedRelays: [] as RelayRow[],
    claimableRelays: [] as RelayRow[],
    registrationCredits: [] as string[],
    registrationCreditsRequired: true,
    registrationCreditsCache: {} as Record<string, boolean>,
    families: {} as Record<string, string[]>,
    relaysMeta: {} as Record<string, RelayMeta>,
    nickNames: {} as Record<string, string>,
    claimableRewards: 0,
    claimedRewardsTotal: 0,
    serials: [] as string[],
    familyRequired: false,
    familyVerifiedCache: {} as Record<string, boolean>,
  }),
  actions: {
    // Get ANYONE balance
    async getTokenBalance(forceRefresh = false) {
      if (!this.userData.address) {
        return;
      }

      if (this.cacheTimings.tokenBalance && !forceRefresh) {
        const now = new Date().getTime();
        if (now - this.cacheTimings.tokenBalance < 30000) {
          return;
        }
      }
      // const token = getAnonAddress() as `0x${string}`;
      const token = getAnonAddressMain() as `0x${string}`;

      this.tokenBalance = await getBalance(config, {
        chainId: mainnet.id,
        token,
        address: this.userData.address as `0x${string}`,
      });

      console.log('token balance', this.tokenBalance);

      this.cacheTimings.tokenBalance = new Date().getTime();
    },
    // Get ANYONE balance in USD using price store
    async getUsdTokenBalance(forceRefresh = false) {
      if (!this.userData.address) {
        return;
      }

      if (this.cacheTimings.tokenBalanceUsd && !forceRefresh) {
        const now = new Date().getTime();
        if (now - this.cacheTimings.tokenBalanceUsd < 30000) {
          return;
        }
      }
      const priceStore = usePriceStore();
      await priceStore.fetchPrice();

      this.tokenBalanceUsd =
        priceStore.currentPrice.data *
        Number(formatEther(this.tokenBalance?.value ?? BigInt(0)));

      this.cacheTimings.tokenBalanceUsd = new Date().getTime();
    },
    async getVerifiedRelays(forceRefresh = false) {
      if (!this.userData.address) {
        this.verifiedRelays = [];
        return;
      }

      const relayCache = useRelayCache();
      const cachedData = await relayCache.getRelayData(forceRefresh);
      if (cachedData) {
        this.verifiedRelays = cachedData.verified;
        return;
      } else {
        // build cache
        await this.createRelayCache();
      }
    },

    async getClaimableRelays(forceRefresh = false) {
      if (!this.userData.address) {
        this.claimableRelays = [];
        return;
      }

      const relayCache = useRelayCache();
      const cachedData = await relayCache.getRelayData(forceRefresh);
      if (cachedData) {
        this.claimableRelays = cachedData.claimable;
        return;
      } else {
        // build cache
        await this.createRelayCache();
      }
    },
    async getRelayCache(forceRefresh = false) {
      if (!this.userData.address) {
        return;
      }

      const relayCache = useRelayCache();
      const cachedData = await relayCache.getRelayData(forceRefresh);
      if (cachedData) {
        this.verifiedRelays = cachedData.verified;
        this.claimableRelays = cachedData.claimable;
        this.nickNames = cachedData.nicknames;
        this.registrationCredits = cachedData.registrationCredits;
        this.families = cachedData.families;
        this.familyRequired = cachedData.familyRequired;
        this.registrationCreditsRequired =
          cachedData.registrationCreditsRequired;
      } else {
        // build cache
        await this.createRelayCache();
      }
    },
    async createRelayCache() {
      if (!this.userData.address) {
        return;
      }

      const operatorRegistry = useOperatorRegistry();
      const relayInfo = await operatorRegistry.getRelayInfoForAddress(
        this.userData.address
      ); //await getAllRelays(this.userData.address);
      if (!relayInfo) {
        return;
      }

      this.nickNames = {}; //data.data.nicknames;
      // refresh the relays
      this.verifiedRelays = relayInfo.verified.map((fingerprint) => ({
        fingerprint,
        status: 'verified',
        consensusWeight: 0,
        observedBandwidth: 0,
        active: true,
        class: '',
        isWorking: false,
        nickname: '',
      }));

      this.claimableRelays = relayInfo.claimable.map((fingerprint) => ({
        fingerprint,
        status: 'claimable',
        consensusWeight: 0,
        observedBandwidth: 0,
        active: true,
        class: '',
        isWorking: false,
        nickname: '',
      }));

      this.registrationCredits = relayInfo.registrationCredits;

      // this.families = data.data.families;

      this.familyRequired = false; //data.data.familyRequired;
      this.registrationCreditsRequired = true; //data.data.registrationCreditsRequired;
      // save to cache
      const relayCache = useRelayCache();

      console.log('refreshing relay metrics, from userstore');

      await relayCache.saveRelayData(relayInfo);
    },
    async hasRegistrationCredit(fingerprint: string) {
      if (!this.userData.address) {
        this.registrationCredits = [];
        return;
      }

      if (!this.registrationCreditsRequired) {
        return true;
      }

      const relayCache = useRelayCache();
      const cachedData = await relayCache.getRelayData();
      if (cachedData) {
        this.registrationCredits = cachedData.registrationCredits;
      } else {
        // build cache
        await this.createRelayCache();
        this.registrationCredits = cachedData.registrationCredits;
      }

      // Check if the fingerprint has registration credits
      const hasCredit =
        this.registrationCredits.includes(fingerprint) ||
        cachedData.verifiedHardware.includes(fingerprint); //cachedData.verifiedHardware[fingerprint] !== undefined;

      // Cache the result
      this.registrationCreditsCache[fingerprint] = hasCredit;

      return hasCredit;
    },
    async familyVerified2(fingerprint: string): Promise<boolean> {
      return true;
      // removed this because it was using a simulation of warp
    },
    async clearCache() {
      const relayCache = useRelayCache();
      this.verifiedRelays = [];
      this.claimableRelays = [];
      this.nickNames = {};
      this.tokenBalanceUsd = 0;
      this.registrationCredits = [];
      await relayCache.clearCache();
    },
    async getRelaysMeta() {},
    async isHardwareRelay(fingerprint: string) {
      const cache = useRelayCache();
      const cachedData = await cache.getRelayData();
      if (cachedData != null) {
        return cachedData.verifiedHardware[fingerprint] !== undefined;
      } else {
        return false;
      }
    },
  },
  getters: {
    // Check if the user has any claimable rewards
    hasClaimableRewards: (state) => state.claimableRewards > 0,
    // All relays, verified and claimable
    allRelays: (state) => [...state.verifiedRelays, ...state.claimableRelays],
  },
  // set initialized state
});
