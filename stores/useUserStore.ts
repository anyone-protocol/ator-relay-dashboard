import { formatEther } from 'viem';
import { useAccount } from 'use-wagmi';
import { getBalance } from 'use-wagmi/actions';
import { type GetBalanceReturnType } from 'use-wagmi/actions';
import type { RelayMeta } from '@/types/relay';

import { warpRead, warpReadSerials } from '@/utils/warp.read';
import { config } from '@/config/wagmi.config';
import { getAtorAddress } from '@/config/web3modal.config';
import type { RelayRow } from '@/types/relay';
import { getRelaysInfo } from '@/utils/relays';

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
    // Get ATOR balance
    async getTokenBalance() {
      if (!this.userData.address) {
        return;
      }
      const token = getAtorAddress() as `0x${string}`;

      console.log('tokenAddress', token);

      this.tokenBalance = await getBalance(config, {
        token,
        address: this.userData.address as `0x${string}`,
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
        // const meta = await getRelaysInfo(
        //   relays.relays.map((relay: { fingerprint: any }) => relay.fingerprint)
        // );
        // this.relaysMeta = {
        //   ...this.relaysMeta,
        //   ...meta,
        // };
      } else {
        const toast = useToast();
        toast.add({
          icon: 'i-heroicons-check-circle',
          color: 'amber',
          title: 'Error',
          timeout: 150000,
          description: `Error fetching verified relays, rate limited...`,
        });

        setTimeout(() => {
          this.getVerifiedRelays();
        }, 15000);
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
        console.log(relays.relays);
        this.claimableRelays = relays.relays;
        // const meta = await getRelaysInfo(
        //   relays.relays.map((relay: { fingerprint: any }) => relay.fingerprint)
        // );
        // this.relaysMeta = {
        //   ...this.relaysMeta,
        //   ...meta,
        // };
      } else {
        const toast = useToast();
        toast.add({
          icon: 'i-heroicons-check-circle',
          color: 'amber',
          title: 'Error',
          timeout: 15000,
          description: `Error fetching claimable relays, rate limited...`,
        });

        // wait for 8 seconds then redo the request
        setTimeout(() => {
          this.getClaimableRelays();
        }, 15000);
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
