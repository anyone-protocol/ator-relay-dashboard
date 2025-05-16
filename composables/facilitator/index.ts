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
import { saveRedeemProcessSessionStorage } from '@/utils/redeemSessionStorage';
import Logger from '~/utils/logger';
// first round

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

const MULTICALL_ABI = [
  {
    constant: true,
    inputs: [
      {
        components: [
          {
            name: 'target',
            type: 'address',
          },
          {
            name: 'callData',
            type: 'bytes',
          },
        ],
        name: 'calls',
        type: 'tuple[]',
      },
    ],
    name: 'aggregate',
    outputs: [
      {
        name: 'blockNumber',
        type: 'uint256',
      },
      {
        name: 'returnData',
        type: 'bytes[]',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];

export class Facilitator {
  private _refreshing: boolean = false;
  private contract!: Contract;
  private multicallContract!: Contract;
  private signer: JsonRpcSigner | null = null;
  private readonly logger = new Logger('Facilitator');

  constructor(
    private contractAddress: string,
    provider: BrowserProvider | AbstractProvider,
    multicallAddress: string
  ) {
    this.multicallContract = new ethers.Contract(
      '0x25eef291876194aefad0d60dff89e268b90754bb',
      MULTICALL_ABI,
      provider
    );
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

    this.logger.info(
      auth.userData?.address
        ? `Refreshing Facilitator for ${auth.userData?.address}`
        : 'Refreshing Facilitator'
    );
    this.logger.time();

    let totalClaimed = null,
      gasAvailable = null,
      gasUsed = null,
      allocatedTokens = null,
      usedBudget = null,
      availableBudget = null,
      oracleWeiRequired = null;

    if (auth.userData?.address) {
      const calls = [
        {
          target: this.contractAddress,
          callData: this.contract.interface.encodeFunctionData(
            'claimedTokens',
            [auth.userData.address]
          ),
        },
        {
          target: this.contractAddress,
          callData: this.contract.interface.encodeFunctionData(
            'allocatedTokens',
            [auth.userData.address]
          ),
        },
        {
          target: this.contractAddress,
          callData: this.contract.interface.encodeFunctionData(
            'availableBudget',
            [auth.userData.address]
          ),
        },
        {
          target: this.contractAddress,
          callData: this.contract.interface.encodeFunctionData('usedBudget', [
            auth.userData.address,
          ]),
        },
        {
          target: this.contractAddress,
          callData: this.contract.interface.encodeFunctionData('GAS_COST', []),
        },
        {
          target: this.contractAddress,
          callData: this.contract.interface.encodeFunctionData('GAS_PRICE', []),
        },
      ];

      const response = await this.multicallContract.aggregate(calls);

      const returnData = response.returnData;

      totalClaimed = BigNumber(
        this.contract.interface
          .decodeFunctionResult('claimedTokens', returnData[0])[0]
          .toString()
      );
      allocatedTokens = BigNumber(
        this.contract.interface
          .decodeFunctionResult('allocatedTokens', returnData[1])[0]
          .toString()
      );
      availableBudget = BigNumber(
        this.contract.interface
          .decodeFunctionResult('availableBudget', returnData[2])[0]
          .toString()
      );
      gasUsed = BigNumber(
        this.contract.interface
          .decodeFunctionResult('usedBudget', returnData[3])[0]
          .toString()
      );
      usedBudget = BigNumber(
        this.contract.interface
          .decodeFunctionResult('usedBudget', returnData[3])[0]
          .toString()
      );
      const gasCost = BigNumber(
        this.contract.interface
          .decodeFunctionResult('GAS_COST', returnData[4])[0]
          .toString()
      );
      const gasPrice = BigNumber(
        this.contract.interface
          .decodeFunctionResult('GAS_PRICE', returnData[5])[0]
          .toString()
      );

      const oracleWeiRequired = gasCost
        .multipliedBy(gasPrice)
        .plus(usedBudget.minus(availableBudget));

      // useFacilitatorStore().totalClaimedTokens = totalClaimed.toString();
      // useFacilitatorStore().alocatedTokens = allocatedTokens.toString();
      // useFacilitatorStore().availableBudget = availableBudget.toString();
      // useFacilitatorStore().usedBudget = usedBudget.toString();
      // useFacilitatorStore().setInitialized(true);

      this.logger.timeEnd();
      this.logger.info('Facilitator refreshed', {
        totalClaimed: totalClaimed.toString(),
        gasAvailable: availableBudget.toString(),
        gasUsed: gasUsed.toString(),
        allocatedTokens: allocatedTokens.toString(),
        oracleWeiRequired: oracleWeiRequired.toString(),
        availableBudget: availableBudget.toString(),
        usedBudget: usedBudget.toString(),
      });
    }
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
      // useFacilitatorStore().totalClaimedTokens = totalClaimedTokens.toString();
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
      // useFacilitatorStore().alocatedTokens = allocatedTokens.toString();
    }

    return BigNumber(allocatedTokens.toString());
  }

  async getAvailableBudget(address: string): Promise<BigNumber> {
    if (!this.contract) {
      throw new Error(ERRORS.NOT_INITIALIZED);
    }

    const availableBudget = (await this.contract.availableBudget(
      address
    )) as bigint;

    return BigNumber(availableBudget.toString());
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

    const GAS_COST = (await this.contract.GAS_COST()) as bigint;
    const GAS_PRICE = (await this.contract.GAS_PRICE()) as bigint;
    const oracleWeiRequired = GAS_COST * GAS_PRICE + usedBudget;

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
      this.logger.error('Error querying facilitator contract events', error);
    }

    return [];
  }

  async claim(): Promise<TransactionResponse | null> {
    const toast = useToast();
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
      toast.add({
        icon: 'i-heroicons-x-circle',
        color: 'amber',
        title: 'Error',
        description: ERRORS.NO_SIGNER,
      });
      throw new Error(ERRORS.NO_SIGNER);
    }
    if (!this.contract) {
      toast.add({
        icon: 'i-heroicons-x-circle',
        color: 'amber',
        title: 'Error',
        description: ERRORS.NOT_INITIALIZED,
      });
      throw new Error(ERRORS.NOT_INITIALIZED);
    }

    try {
      const oracleWeiRequired = await this.getOracleWeiRequired();

      const value = oracleWeiRequired.toString();
      const to = await this.contract.getAddress();

      const result = await this.signer.sendTransaction({ to, value });

      const maxRetries = 3;
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await result.wait();
          continue;
        } catch (error) {
          if (attempt < maxRetries) {
            this.logger.warn(
              `Attempt ${attempt} failed, retrying in 2 seconds...`
            );
            await delay(2000);
          } else {
            throw new Error(
              `Transaction confirmation failed after ${maxRetries} attempts`
            );
          }
        }
      }
      const block = await result.getBlock();
      const timestamp = block?.timestamp || Math.floor(Date.now() / 1000);
      // useFacilitatorStore().addPendingClaim(result.hash, timestamp);

      return result;
    } catch (error) {
      const msg = (error as Error)?.message;
      console.log('msg', msg);

      if (msg.includes('user rejected action')) {
        toast.add({
          icon: 'i-heroicons-x-circle',
          color: 'amber',
          title: 'Error',
          description: 'User denied transaction signature.',
        });
      } else {
        toast.add({
          icon: 'i-heroicons-x-circle',
          color: 'amber',
          title: 'Error',
          description: 'Error redeeming rewards',
        });
      }

      // if (!msg.includes('User denied transaction signature.')) {
      //   toast.add({
      //     icon: 'i-heroicons-x-circle',
      //     color: 'amber',
      //     title: 'Error',
      //     description: `Error redeeming rewards: ${msg}`,
      //   });
      // }

      this.logger.error(ERRORS.FUNDING_ORACLE, error);
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
      // const facilitatorStore = useFacilitatorStore();
      const result = await this.contract.updateAllocation(
        auth.userData.address,
        amount,
        false
      );
      await result.wait();
      const block = await result.getBlock();
      const timestamp = block?.timestamp || Math.floor(Date.now() / 1000);

      // facilitatorStore.alocatedTokens = amount.toString();
      return result;
    } catch (error) {
      this.logger.error(ERRORS.REQUESTING_UPDATE, error);
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
        this.logger.info('onAllocationClaimed()', address, amount.toString());
        // const store = useFacilitatorStore();
        // await store.onAllocationClaimed(amount, event);
        const tx = await event.getTransaction();
        await tx.wait();
        await this.getTotalClaimedTokens(auth.userData.address);
        await this.getAllocatedTokens(auth.userData.address);
      }
    } catch (error) {
      this.logger.error('Error consuming AllocationClaimed event', error);
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
        this.logger.info('onAllocationClaimed()', address, amount.toString());
        // const store = useFacilitatorStore();
        // await store.onAllocationUpdated(amount, event);
        const tx = await event.getTransaction();
        await tx.wait();
        await this.getTotalClaimedTokens(auth.userData.address);
        await this.getAllocatedTokens(auth.userData.address);
        await auth.getTokenBalance();
      }
    } catch (error) {
      this.logger.error('Error consuming AllocationClaimed event', error);
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
      provider,
      runtimeConfig.public.multicallContract as string // Add your multicall contract address here
    );
    await facilitator.refresh();
  }
};
export const useFacilitator = () => facilitator;
