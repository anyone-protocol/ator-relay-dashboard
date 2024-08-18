import { formatEther } from 'viem';
import { useAccount } from '@wagmi/vue';
import { getBalance } from '@wagmi/core';
import { type GetBalanceReturnType } from '@wagmi/core';
import type { RelayMeta } from '@/types/relay';
import { handle as RegistryHandle } from '@/contracts/relay-registry';

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

type CacheData = {
  tokenBalance: number;
  tokenBalanceUsd: number;
};

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
    // Get ANON balance
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
      const token = getAnonAddress() as `0x${string}`;

      this.tokenBalance = await getBalance(config, {
        token,
        address: this.userData.address as `0x${string}`,
      });

      this.cacheTimings.tokenBalance = new Date().getTime();
    },
    // Get ANON balance in USD using price store
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
    async getVerifiedRelaysOld(forceRefresh = false) {
      if (!this.userData.address) {
        this.verifiedRelays = [];
        return;
      }

      const relayCache = useRelayCache();
      if (!forceRefresh) {
        const cachedData = await relayCache.getRelayData();
        if (cachedData) {
          this.verifiedRelays = cachedData.verified;
          return;
        }
      }

      const verified: any = await warpRead(this.userData.address, 'verified');
      if (verified.status === 200) {
        const relays = await verified.json();
        this.verifiedRelays = relays.relays;
        await relayCache.saveRelayDataWithKey('verified', this.verifiedRelays);
      } else if (verified.status === 500) {
        this.verifiedRelays = [];
        throw new Error('rate limited');
      }
    },

    async getClaimableRelaysOld(forceRefresh = false) {
      if (!this.userData.address) {
        this.claimableRelays = [];
        return;
      }

      const relayCache = useRelayCache();
      if (!forceRefresh) {
        const cachedData = await relayCache.getRelayData();
        if (cachedData) {
          this.claimableRelays = cachedData.claimable;
          return;
        }
      }

      const claimable: any = await warpRead(this.userData.address, 'claimable');
      if (claimable.status === 200) {
        const relays = await claimable.json();
        this.claimableRelays = relays.relays;
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
    async createRelayCache() {
      if (!this.userData.address) {
        return;
      }

      // const data = await getAllRelays(this.userData.address);

      // testing
      const data = await getAllRelays(
        '0x1be90812147Fe66B93E4ea4CD4893fA789e40f70'
      );
      if (!data) {
        return;
      }

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

      this.registrationCredits = data.data.registrationCredits;

      this.families = data.data.families;

      this.familyRequired = data.data.familyRequired;
      this.registrationCreditsRequired = data.data.registrationCreditsRequired;

      // save to cache
      const relayCache = useRelayCache();
      await relayCache.saveRelayData(data.data);
    },
    async hasRegistrationCredit(fingerprint: string, forceRefresh = false) {
      if (!this.userData.address) {
        this.registrationCredits = [];
        return;
      }

      if (!this.registrationCreditsRequired) {
        return true;
      }

      if (
        !forceRefresh &&
        this.registrationCreditsCache[fingerprint] !== undefined
      ) {
        return this.registrationCreditsCache[fingerprint];
      }

      const relayCache = useRelayCache();
      const cachedData = await relayCache.getRelayData(forceRefresh);
      if (cachedData) {
        this.registrationCredits = cachedData.registrationCredits;
      } else {
        // build cache
        await this.createRelayCache();
        this.registrationCredits = cachedData.registrationCredits;
      }
      // Check if the fingerprint has registration credits
      const hasCredit = this.registrationCredits.includes(fingerprint);

      // Cache the result
      this.registrationCreditsCache[fingerprint] = hasCredit;

      return hasCredit;
    },
    async familyVerified(fingerprint: string) {
      if (!this.userData.address) {
        return false;
      }
      if (!this.familyRequired) {
        return true;
      }

      if (this.familyVerifiedCache[fingerprint] !== undefined) {
        return this.familyVerifiedCache[fingerprint];
      }

      const relayCache = useRelayCache();
      const cachedData = await relayCache.getRelayData();
      if (cachedData) {
        if (cachedData.families[fingerprint]) {
          if (
            this.families[fingerprint].length === 0 ||
            (this.families[fingerprint].length === 1 &&
              this.families[fingerprint][0] === fingerprint)
          ) {
            this.familyVerifiedCache[fingerprint] = true;
            return true;
          }

          const userFingerprints = this.verifiedRelays;
          // shallow copy
          const familyFingerprints = (this.families[fingerprint] || []).slice(
            0
          );
          const claimingFamilyIncludesAllVerifiedRelays =
            userFingerprints.every((fp) =>
              familyFingerprints.includes(fp.fingerprint)
            );
          if (!claimingFamilyIncludesAllVerifiedRelays) {
            this.familyVerifiedCache[fingerprint] = false;
            return false;
          }

          for (let i = 0; i < userFingerprints.length; i++) {
            if (
              !this.families[userFingerprints[i].fingerprint].includes(
                fingerprint
              )
            ) {
              this.familyVerifiedCache[fingerprint] = false;
              return false;
            }
          }
          this.familyVerifiedCache[fingerprint] = true;

          return true;
        } else {
          this.familyVerifiedCache[fingerprint] = false;
          return true;
        }
      } else {
        // build cache
        await this.createRelayCache();
        return true;
      }
    },
    async familyVerified2(fingerprint: string): Promise<boolean> {
      const input = {
        function: 'claim',
        fingerprint: fingerprint,
      };

      const interaction = {
        input,
        caller: this.userData.address,
        interactionType: 'write',
      };

      const relayCache = useRelayCache();
      const cachedData = await relayCache.getRelayData();
      if (cachedData) {
        try {
          const result = await RegistryHandle(cachedData.state, interaction);
          return true;
        } catch (error: any) {
          switch (error.message) {
            case 'Subsequent relay claims require family to be set':
              return false;
            default:
              return true;
          }
        }
      } else {
        await this.createRelayCache();
        return true;
      }

      return false;
    },
    async clearCache() {
      const relayCache = useRelayCache();
      this.verifiedRelays = [];
      this.claimableRelays = [];
      this.nickNames = {};
      this.registrationCredits = [];
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
  // set initialized state
});
