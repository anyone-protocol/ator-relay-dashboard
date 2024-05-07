import { formatEther } from "viem";
import { useAccount } from "use-wagmi";
import { getBalance } from "use-wagmi/actions";
import { type GetBalanceReturnType } from "use-wagmi/actions";

import { warpRead } from "@/utils/warp.read";
import { config } from "@/config/wagmi.config";
import { atorAddress } from "@/config/web3modal.config";

export type RelayRow = {
  fingerprint: string;
  status: string;
  consensusWeight: number;
  observedBandwidth: number;
  active: boolean;
  class?: string;
  isWorking?: boolean;
};

export const useUserStore = defineStore("user", {
  state: () => ({
    address: null as `0x${string}` | null,
    userData: useAccount({config}),
    tokenBalance: {
      value: 0n,
      symbol: "",
      decimals: 0,
      formatted: "0",
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
      if (!this.address) {
        return;
      }
      this.tokenBalance = await getBalance(config, {
        token: atorAddress,
        address: this.address as `0x${string}`,
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
      if (!this.address) {
        return;
      }

      const verified = await warpRead(this.address, "verified");

      if (verified.status === 200) {
        const relays = await verified.json();
        this.verifiedRelays = relays.relays;
      }
    },
    // Get claimable relays using Warp
    async getClaimableRelays() {
      if (!this.address) {
        return;
      }

      const claimable = await warpRead(this.address, "claimable");

      if (claimable.status === 200) {
        const relays = await claimable.json();
        this.claimableRelays = relays.relays;
      }
    },
    // TODO: Implement this method
    async getClaimableRewards() {
      if (!this.address) {
        return;
      }
      // Mocked response
      this.claimableRewards = 10;
    },
    // TODO: Implement this method
    async getClaimedRewardsTotal() {
      if (!this.address) {
        return;
      }
      // Mocked response
      this.claimedRewardsTotal = 145;
    },
    // TODO: Claim all rewards
    async claimAllRewards() {
      if (!this.address) {
        return;
      }
      const toast = useToast();
      // TODO: Sign the transaction
      window.alert("Sign the message");

      const allRelays = [...this.verifiedRelays, ...this.claimableRelays];
      const allFingerprints = allRelays.map((relay) => relay.fingerprint);

      try {
        // Probably more to do here other than just call the contract functions
        await warpWrite(allFingerprints, "claim");

        // On success, update the store
        this.claimableRewards = 0;

        toast.add({
          icon: "i-heroicons-check-circle",
          color: "primary",
          title: "Success",
          description: "Successfully claimed all  relay rewards!",
        });
      } catch (error) {
        toast.add({
          icon: "i-heroicons-x-circle",
          color: "amber",
          title: "Error",
          description: `Error claiming rewards: ${error}`,
        });
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
