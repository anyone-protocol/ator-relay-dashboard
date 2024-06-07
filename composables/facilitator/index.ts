import {
  AbstractProvider,
  BrowserProvider,
  Contract,
  ContractUnknownEventPayload,
  JsonRpcSigner,
  TransactionResponse,
  ethers,
} from 'ethers';
import BigNumber from 'bignumber.js';

import { abi } from './Facility.json';
import { useFacilitatorStore } from '@/stores/useFacilitatorStore';
import { saveRedeemProcessSessionStorage } from '@/utils/redeemSessionStorage';
import { useDistribution } from '../distribution';

const runtimeConfig = useRuntimeConfig();

export const FACILITATOR_EVENTS = {
  AllocationUpdated: 'AllocationUpdated',
  AllocationClaimed: 'AllocationClaimed',
  GasBudgetUpdated: 'GasBudgetUpdated',
  RequestingUpdate: 'RequestingUpdate',
};
export type FacilitatorEvent = keyof typeof FACILITATOR_EVENTS;

const ERRORS = {
  NOT_INITIALIZED: 'Facilitator is not initialized!',
  CONNECTING_CONTRACT:
    'There was an error connecting to the Facilitator Contract',
  CLAIMING_TOKENS: 'Error claiming tokens',
  COULD_NOT_FUND_ORACLE: 'Could not fund Oracle',
  FUNDING_ORACLE: 'Error funding Oracle',
  REQUESTING_UPDATE: 'Error requesting update from Facilitator',
  REQUESTING_UPDATE_NOT_SUCCESSFUL:
    'Requesting update from Facilitator was not successful',
  RECEIVE_AND_REQUEST_UPDATE:
    'Error funding & requesting update from Facilitator',
  NO_PROVIDER: 'No Provider to initialize Facilitator',
  NO_SIGNER: 'No Signer connected',
};

export class Facilitator {
  private _refreshing: boolean = false;
  private contract!: Contract;
  private signer: JsonRpcSigner | null = null;
  private readonly logger = console;

  constructor(
    private contractAddress: string,
    provider: BrowserProvider | AbstractProvider
  ) {
    this.refreshContract(provider);
  }

  static buildContract(
    contractAddress: string,
    providerOrSigner: BrowserProvider | AbstractProvider | JsonRpcSigner
  ): Contract {
    return new Contract(contractAddress, abi, providerOrSigner);
  }

  private refreshContract(
    providerOrSigner: BrowserProvider | AbstractProvider | JsonRpcSigner
  ) {
    this.contract = Facilitator.buildContract(
      this.contractAddress,
      providerOrSigner
    );
    /* eslint-disable-next-line @typescript-eslint/no-floating-promises */
    this.listenForUserEvents();
  }

  async setSigner(signer?: JsonRpcSigner) {
    if (signer) {
      this.signer = signer;
      this.refreshContract(this.signer);
    } else {
      this.signer = null;
      this.refreshContract(useProvider());
    }
    /* eslint-disable-next-line @typescript-eslint/no-floating-promises */
    return this.refresh();
  }

  private setRefreshing(refreshing: boolean) {
    useState<boolean>('facilitator-refreshing').value = refreshing;
    this._refreshing = refreshing;
  }

  async refresh(): Promise<void> {
    if (this._refreshing) {
      return;
    }

    this.setRefreshing(true);
    const auth = useUserStore();
    console.info(
      auth.userData?.address
        ? `Refreshing Facilitator for ${auth.userData?.address}`
        : 'Refreshing Facilitator'
    );
    console.time();

    let totalClaimed = null,
      gasAvailable = null,
      gasUsed = null,
      allocatedTokens = null,
      usedBudget = null,
      availableBudget = null;

    if (auth.userData?.address) {
      totalClaimed = await this.getTotalClaimedTokens(auth.userData.address);
      allocatedTokens = await this.getAllocatedTokens(auth.userData.address);
      gasAvailable = await this.getGasAvailable(auth.userData.address);
      gasUsed = await this.getGasUsed(auth.userData.address);
      usedBudget = await this.getUsedBudget(auth.userData.address);
      availableBudget = await this.getAvailableBudget(auth.userData.address);
    }
    const oracleWeiRequired = await this.getOracleWeiRequired();

    console.timeEnd();
    console.info('Facilitator refreshed', {
      totalClaimed: totalClaimed?.toString(),
      gasAvailable: gasAvailable?.toString(),
      gasUsed: gasUsed?.toString(),
      allocatedTockens: allocatedTokens?.toString(),
      oracleWeiRequired: oracleWeiRequired.toString(),
      availableBudget: availableBudget?.toString(),
      usedBudget: usedBudget?.toString(),
    });
    this.setRefreshing(false);
  }

  async getTotalClaimedTokens(address: string): Promise<BigNumber> {
    if (!this.contract) {
      throw new Error(ERRORS.NOT_INITIALIZED);
    }

    const totalClaimedTokens = (await this.contract.claimedTokens(
      address
    )) as bigint;

    if (address === useUserStore().userData?.address) {
      useFacilitatorStore().totalClaimedTokens = totalClaimedTokens.toString();
    }

    return BigNumber(totalClaimedTokens.toString());
  }

  async getAllocatedTokens(address: string): Promise<BigNumber> {
    if (!this.contract) {
      throw new Error(ERRORS.NOT_INITIALIZED);
    }

    const allocatedTokens = (await this.contract.allocatedTokens(
      address
    )) as bigint;

    if (address === useUserStore().userData?.address) {
      useFacilitatorStore().alocatedTokens = allocatedTokens.toString();
    }

    return BigNumber(allocatedTokens.toString());
  }

  async getAvailableBudget(address: string): Promise<bigint> {
    if (!this.contract) {
      throw new Error(ERRORS.NOT_INITIALIZED);
    }

    const availableBudget = (await this.contract.availableBudget(
      address
    )) as bigint;

    return availableBudget;
  }

  async getUsedBudget(address: string): Promise<bigint> {
    if (!this.contract) {
      throw new Error(ERRORS.NOT_INITIALIZED);
    }

    const usedBudget = (await this.contract.usedBudget(address)) as bigint;

    return usedBudget;
  }

  async getGasAvailable(address: string): Promise<BigNumber> {
    if (!this.contract) {
      throw new Error(ERRORS.NOT_INITIALIZED);
    }

    const gasAvailable = (await this.contract.availableBudget(
      address
    )) as bigint;

    return BigNumber(gasAvailable.toString());
  }

  async getGasUsed(address: string): Promise<BigNumber> {
    if (!this.contract) {
      throw new Error(ERRORS.NOT_INITIALIZED);
    }

    const gasUsed = (await this.contract.usedBudget(address)) as bigint;

    return BigNumber(gasUsed.toString());
  }

  async getOracleWeiRequired(): Promise<BigNumber> {
    const auth = useUserStore();

    if (!this.contract) {
      throw new Error(ERRORS.NOT_INITIALIZED);
    }

    if (!auth.userData?.address) {
      throw new Error(ERRORS.NO_SIGNER);
    }

    const usedBudget = await this.getUsedBudget(auth.userData.address);
    const availableBudget = await this.getAvailableBudget(
      auth.userData.address
    );

    const GAS_COST = (await this.contract.GAS_COST()) as bigint;
    const GAS_PRICE = (await this.contract.GAS_PRICE()) as bigint;
    const oracleWeiRequired =
      GAS_COST * GAS_PRICE + (usedBudget - availableBudget);

    return BigNumber(oracleWeiRequired.toString());
  }

  async query(
    facilitatorEvent: FacilitatorEvent,
    address: string,
    fromBlock?: ethers.BlockTag,
    toBlock?: ethers.BlockTag
  ): Promise<(ethers.EventLog | ethers.Log)[]> {
    if (!this.contract) {
      throw new Error(ERRORS.NOT_INITIALIZED);
    }

    try {
      const filter = this.contract.filters[facilitatorEvent](address);

      return await this.contract.queryFilter(filter, fromBlock, toBlock);
    } catch (error) {
      console.error('Error querying facilitator contract events', error);
    }

    return [];
  }

  async claim(): Promise<TransactionResponse | null> {
    const auth = useUserStore();

    let signer: JsonRpcSigner | undefined;
    if (auth.userData) {
      const _signer = await useSigner();
      if (_signer) {
        signer = _signer;
      }
    }

    await this.setSigner(signer);

    if (!this.signer) {
      throw new Error(ERRORS.NO_SIGNER);
    }
    if (!this.contract) {
      throw new Error(ERRORS.NOT_INITIALIZED);
    }

    const toast = useToast();

    try {
      const oracleWeiRequired = await this.getOracleWeiRequired();

      const value = oracleWeiRequired.toString();
      const to = await this.contract.getAddress();
      const result = await this.signer.sendTransaction({ to, value });
      await result.wait();
      const block = await result.getBlock();
      const timestamp = block?.timestamp || Math.floor(Date.now() / 1000);
      useFacilitatorStore().addPendingClaim(result.hash, timestamp);

      return result;
    } catch (error) {
      const msg = (error as Error)?.message;

      if (!msg.includes('User denied transaction signature.')) {
        toast.add({
          icon: 'i-heroicons-x-circle',
          color: 'amber',
          title: 'Error',
          description: `Error redeen rewards: ${msg}`,
        });
      }

      console.error(ERRORS.FUNDING_ORACLE, error);
    }

    return null;
  }

  updateAllocation = async (
    amount: bigint
  ): Promise<TransactionResponse | null> => {
    if (!this.signer) {
      throw new Error(ERRORS.NO_SIGNER);
    }
    if (!this.contract) {
      throw new Error(ERRORS.NOT_INITIALIZED);
    }
    const auth = useUserStore();

    try {
      const facilitatorStore = useFacilitatorStore();
      const result = await this.contract.updateAllocation(
        auth.userData.address,
        amount,
        false
      );
      await result.wait();
      const block = await result.getBlock();
      const timestamp = block?.timestamp || Math.floor(Date.now() / 1000);

      facilitatorStore.alocatedTokens = amount.toString();
      return result;
    } catch (error) {
      console.error(ERRORS.REQUESTING_UPDATE, error);
    }

    return null;
  };

  private async onAllocationClaimed(
    address: string,
    amount: bigint,
    event: ContractUnknownEventPayload
  ): Promise<void> {
    try {
      const auth = useUserStore();
      if (!auth.userData?.address) {
        return;
      }
      saveRedeemProcessSessionStorage(auth.userData.address, null);

      if (auth.userData.address === address) {
        console.info('onAllocationClaimed()', address, amount);
        const store = useFacilitatorStore();
        await store.onAllocationClaimed(amount, event);
        const tx = await event.getTransaction();
        await tx.wait();
        await this.getTotalClaimedTokens(auth.userData.address);
        await this.getAllocatedTokens(auth.userData.address);
        await useDistribution().claimable(auth.userData.address as string);
      }
    } catch (error) {
      console.error('Error consuming AllocationClaimed event', error);
    }
  }

  private async onAllocationUpdated(
    address: string,
    amount: bigint,
    event: ContractUnknownEventPayload
  ): Promise<void> {
    try {
      const auth = useUserStore();
      if (!auth.userData) {
        return;
      }
      if (auth.userData.address === address) {
        console.info('onAllocationClaimed()', address, amount);
        const store = useFacilitatorStore();
        await store.onAllocationUpdated(amount, event);
        const tx = await event.getTransaction();
        await tx.wait();
        await this.getTotalClaimedTokens(auth.userData.address);
        await this.getAllocatedTokens(auth.userData.address);
        await auth.getTokenBalance();
      }
    } catch (error) {
      console.error('Error consuming AllocationClaimed event', error);
    }
  }
  private async onGasBudgetUpdated(): Promise<void> {}
  private async onRequestingUpdate(): Promise<void> {}

  private async listenForUserEvents() {
    if (!this.contract) {
      throw new Error(ERRORS.NOT_INITIALIZED);
    }

    await this.contract.off(FACILITATOR_EVENTS.AllocationClaimed);
    await this.contract.off(FACILITATOR_EVENTS.AllocationUpdated);
    await this.contract.off(FACILITATOR_EVENTS.GasBudgetUpdated);
    await this.contract.off(FACILITATOR_EVENTS.RequestingUpdate);

    const auth = useUserStore();
    if (!auth.userData) {
      return;
    }

    await this.contract.on(
      FACILITATOR_EVENTS.AllocationClaimed,
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
      this.onAllocationClaimed.bind(this)
    );
    await this.contract.on(
      FACILITATOR_EVENTS.AllocationUpdated,
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
      this.onAllocationUpdated.bind(this)
    );
    await this.contract.on(
      FACILITATOR_EVENTS.GasBudgetUpdated,
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
      this.onGasBudgetUpdated.bind(this)
    );
    await this.contract.on(
      FACILITATOR_EVENTS.RequestingUpdate,
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
      this.onRequestingUpdate.bind(this)
    );
  }
}

let facilitator: Facilitator | null = null;
export const initFacilitator = async () => {
  const provider = useProvider();

  if (!facilitator) {
    facilitator = new Facilitator(
      runtimeConfig.public.facilitatorContract as string,
      provider
    );
    await facilitator.refresh();
  }
};
export const useFacilitator = () => facilitator;
