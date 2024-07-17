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
      if (!this.userData.address) {
        return 0;
      }
      const priceStore = usePriceStore();
      await priceStore.fetchPrice();

      this.tokenBalanceUsd =
        priceStore.currentPrice.data *
        Number(formatEther(this.tokenBalance?.value ?? BigInt(0)));
    },
    async getVerifiedRelaysOld(forceRefresh = false) {
      if (!this.userData.address) {
        this.verifiedRelays = [];
        return;
      }

      const relayCache = useRelayCache();
      if (!forceRefresh) {
        console.log('Fetching verified relays from cache');
        const cachedData = await relayCache.getRelayData();
        if (cachedData) {
          console.log('Using cached verified relays', cachedData);
          this.verifiedRelays = cachedData.verified;
          return;
        }
      }

      const verified: any = await warpRead(this.userData.address, 'verified');
      if (verified.status === 200) {
        const relays = await verified.json();
        this.verifiedRelays = relays.relays;
        console.log('Saving verified relays to cache', this.verifiedRelays);
        await relayCache.saveRelayDataWithKey('verified', this.verifiedRelays);
      } else if (verified.status === 500) {
        this.verifiedRelays = [];
        throw new Error('rate limited');
      }
    },

    async getClaimableRelaysOld(forceRefresh = false) {
      console.log('forcerefresh', forceRefresh);
      if (!this.userData.address) {
        this.claimableRelays = [];
        return;
      }

      const relayCache = useRelayCache();
      if (!forceRefresh) {
        console.log('Fetching claimable relays from cache');
        const cachedData = await relayCache.getRelayData();
        if (cachedData) {
          console.log('Using cached claimable relays', cachedData);
          this.claimableRelays = cachedData.claimable;
          return;
        }
      }

      const claimable: any = await warpRead(this.userData.address, 'claimable');
      if (claimable.status === 200) {
        const relays = await claimable.json();
        this.claimableRelays = relays.relays;
        console.log('Saving claimable relays to cache', this.claimableRelays);
        await relayCache.saveRelayDataWithKey(
          'claimable',
          this.claimableRelays
        );
      } else if (claimable.status === 500) {
        this.claimableRelays = [];
        throw new Error('rate limited');
      }
    },
    // Get verified relays using Warp
    async getVerifiedRelays(forceRefresh = false) {
      if (!this.userData.address) {
        this.verifiedRelays = [];
        return;
      }

      const relayCache = useRelayCache();
      console.log('Fetching verified relays from cache');
      const cachedData = await relayCache.getRelayData(forceRefresh);
      if (cachedData) {
        console.log('Using cached verified relays');
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
      console.log('Fetching claimable relays from cache');
      const cachedData = await relayCache.getRelayData(forceRefresh);
      if (cachedData) {
        console.log('Using cached claimable relays');
        this.claimableRelays = cachedData.claimable;
        return;
      } else {
        // build cache
        await this.createRelayCache();
      }
    },
    // async claimRelayRefresh(forceRefresh = false) {
    //   console.log('forcerefresh', forceRefresh);

    //   let error = true;
    //   const toast = useToast();
    //   while (error) {
    //     try {
    //       await this.getClaimableRelays(forceRefresh);
    //       error = false;
    //       toast.remove('claimable-relays-error');
    //     } catch (e) {
    //       await new Promise((resolve) => setTimeout(resolve, 15000));
    //     }
    //   }
    // },
    // async verifiedRelaysRefresh(forceRefresh = false) {
    //   let error = true;
    //   const toast = useToast();
    //   while (error) {
    //     try {
    //       await this.getVerifiedRelays(forceRefresh);
    //       error = false;
    //       toast.remove('verified-relays-error');
    //     } catch (e) {
    //       await new Promise((resolve) => setTimeout(resolve, 15000));
    //     }
    //   }
    // },
    async createRelayCache() {
      if (!this.userData.address) {
        return;
      }

      const data = await getAllRelays(this.userData.address);
      if (!data) {
        console.log('Failed to get relays');
        return;
      }

      console.log(data);

      this.nickNames = data.data.nicknames;
      // refresh the relays
      this.verifiedRelays = data.data.verified.map((relay) => ({
        fingerprint: relay.fingerprint,
        status: relay.status,
        consensusWeight: 0,
        observedBandwidth: 0,
        active: relay.active,
        class: relay.class,
        isWorking: false,
        nickname: '',
      }));

      this.claimableRelays = data.data.claimable.map((relay) => ({
        fingerprint: relay.fingerprint,
        status: relay.status,
        consensusWeight: 0,
        observedBandwidth: 0,
        active: relay.active,
        class: relay.class,
        isWorking: false,
        nickname: '',
      }));

      console.log('verified relays', this.verifiedRelays);
      console.log('claimable relays', this.claimableRelays);

      // save to cache
      const relayCache = useRelayCache();
      await relayCache.saveRelayData(data.data);
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
          return;
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
