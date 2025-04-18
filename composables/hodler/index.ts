import {
  AbstractProvider,
  BrowserProvider,
  Contract,
  ContractUnknownEventPayload,
  JsonRpcSigner,
  TransactionResponse,
  ethers,
  formatEther,
} from 'ethers';
import BigNumber from 'bignumber.js';

import abi from './Hodler.json';
import { useFacilitatorStore } from '@/stores/useFacilitatorStore';
import { saveRedeemProcessSessionStorage } from '@/utils/redeemSessionStorage';
import Logger from '~/utils/logger';
import type { Lock, Vault } from '~/types/hodler';
import { useHolderStore } from '~/stores/useHodlerStore';
import { useToken } from '../token';
// first round

const runtimeConfig = useRuntimeConfig();

export const HODLER_EVENTS = {
  AddedVotes: 'AddedVotes',
  Locked: 'Locked',
  GasBudgetUpdated: 'GasBudgetUpdated',
  RequestingUpdate: 'RequestingUpdate',
};
export type HodlerEvent = keyof typeof HODLER_EVENTS;

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

export class Hodler {
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
    this.contract = Hodler.buildContract(
      this.contractAddress,
      providerOrSigner
    );
    /* eslint-disable-next-line @typescript-eslint/no-floating-promises */
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
        ? `Refreshing Hodler for ${auth.userData?.address}`
        : 'Refreshing Hodler'
    );
    this.setRefreshing(false);
  }

  async getLocks(address: string): Promise<Record<string, Lock>> {
    return new Promise(async (resolve, reject) => {
      if (!this.contract) {
        reject(ERRORS.NOT_INITIALIZED);
        return;
      }

      const locks = await this.contract.getLocks(address);
      this.logger.info('getLocks', locks);

      const locksResult: Record<string, Lock> = {};

      for (let i = 0; i < locks.length; i++) {
        const lock = locks[i];
        const fingerprint = lock.fingerprint as string;
        const operator = lock.operator as string;
        const amount = BigNumber(lock.amount.toString())
          .dividedBy(Math.pow(10, 18))
          .toFixed(3);
        locksResult[fingerprint] = {
          fingerprint,
          operator,
          amount,
        };
      }

      resolve(locksResult);
    });
  }

  async getVaults(address: string): Promise<Vault[]> {
    return new Promise(async (resolve, reject) => {
      if (!this.contract) {
        reject(ERRORS.NOT_INITIALIZED);
        return;
      }

      const vaults = await this.contract.getVaults(address);
      this.logger.info('getVaults', vaults);

      const vaultsResult: Vault[] = [];

      for (let i = 0; i < vaults.length; i++) {
        const vault = vaults[i];
        const amount = BigNumber(vault.amount.toString())
          .dividedBy(Math.pow(10, 18))
          .toFixed(3);
        const availableAt = Number(vault.availableAt.toString()) * 1000;
        const kind = Number(vault.kind.toString());
        const data = vault.data as string;

        vaultsResult.push({
          amount,
          availableAt,
          kind,
          data,
        });
      }
      resolve(vaultsResult);
    });
  }

  async lock(
    fingerprint: string,
    address: string
  ): Promise<TransactionResponse | null> {
    return new Promise(async (resolve, reject) => {
      const toast = useToast();
      const auth = useUserStore();
      const hodlerStore = useHolderStore();

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
      if (!this.contract || !hodlerStore.lockSize) {
        throw new Error(ERRORS.NOT_INITIALIZED);
      }

      try {
        const token = useToken();
        if (!token) {
          throw new Error(ERRORS.NOT_INITIALIZED);
        }

        const tokenResult = await token.approve(
          runtimeConfig.public.hodlerContract as string,
          hodlerStore.lockSize
        );

        toast.add({
          icon: 'i-heroicons-clock',
          color: 'primary',
          id: 'approve-token',
          timeout: 0,
          title: 'Approving token...',
          closeButton: undefined,
        });
        await tokenResult?.wait();

        toast.remove('approve-token');
        toast.add({
          icon: 'i-heroicons-check-circle',
          id: 'token-approved',
          color: 'primary',
          title:
            'Token approved! Please accept the transaction to lock the relay.',
        });

        const result = await this.contract
          .connect(this.signer)
          // @ts-ignore
          .lock(fingerprint, address == '' ? auth.userData.address : address);

        toast.remove('token-approved');
        toast.add({
          icon: 'i-heroicons-clock',
          color: 'primary',
          id: 'lock-relay',
          timeout: 0,
          title: 'Locking relay...',
          closeButton: undefined,
        });
        await result.wait();
        toast.remove('lock-relay');
        await this.refresh();

        toast.add({
          icon: 'i-heroicons-check-circle',
          color: 'primary',
          title: 'Success',
          id: 'relay-locked',
          timeout: 0,
          description: `We've locked ${formatEther(hodlerStore.lockSize || '0')} $ANYONE.  Once picked up on Arweave, you can click the 'claim' button to claim your relay.`,
        });

        resolve(result);
      } catch (error) {
        const msg = (error as Error)?.message;
        console.log('msg: ', msg);
        if (msg.includes('transfer amount exceeds balance')) {
          toast.add({
            icon: 'i-heroicons-x-circle',
            color: 'amber',
            title: 'Error',
            description: `Error locking ${formatEther(hodlerStore.lockSize || '0')} $ANYONE: You have insufficient $ANYONE tokens`,
          });
        } else if (msg.includes('missing revert data')) {
          toast.add({
            icon: 'i-heroicons-x-circle',
            color: 'amber',
            title: 'Error',
            description: `Error locking ${formatEther(hodlerStore.lockSize || '0')} $ANYONE: You have insufficient $ANYONE tokens`,
          });
        } else if (!msg.includes('User denied transaction signature.')) {
          toast.add({
            icon: 'i-heroicons-x-circle',
            color: 'amber',
            title: 'Error',
            description: `Error locking ${formatEther(hodlerStore.lockSize || '0')} $ANYONE, did you approve the transaction?`,
          });
        } else {
          toast.add({
            icon: 'i-heroicons-x-circle',
            color: 'amber',
            title: 'Error',
            description: 'User denied transaction signature.',
          });
        }

        this.logger.error(ERRORS.FUNDING_ORACLE, error);
      }

      resolve(null);
    });
  }

  async unlock(
    fingerprint: string,
    address: string
  ): Promise<TransactionResponse | null> {
    return new Promise(async (resolve, reject) => {
      const toast = useToast();
      const auth = useUserStore();
      const hodlerStore = useHolderStore();

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

      try {
        const result = await this.contract
          .connect(this.signer)
          // @ts-ignore
          .unlock(fingerprint, address == '' ? auth.userData.address : address);

        toast.remove('token-approved');
        toast.add({
          icon: 'i-heroicons-clock',
          color: 'primary',
          id: 'unlock-relay',
          timeout: 0,
          title: 'Unlocking relay...',
          closeButton: undefined,
        });
        await result.wait();
        toast.remove('unlock-relay');

        await this.refresh();

        toast.add({
          icon: 'i-heroicons-check-circle',
          color: 'primary',
          title: 'Success',
          id: 'relay-unlocked',
          timeout: 0,
          description: `We've unlocked your relay. A new vault has been created for you.`,
        });
      } catch (error) {
        const msg = (error as Error)?.message;
        console.log('msg: ', msg);
        if (msg.includes('transfer amount exceeds balance')) {
          toast.add({
            icon: 'i-heroicons-x-circle',
            color: 'amber',
            title: 'Error',
            description: `Error unlocking ${formatEther(hodlerStore.lockSize || '0')} $ANYONE: You have insufficient $ANYONE tokens`,
          });
        } else if (msg.includes('missing revert data')) {
          toast.add({
            icon: 'i-heroicons-x-circle',
            color: 'amber',
            title: 'Error',
            description: `Error unlocking ${formatEther(hodlerStore.lockSize || '0')} $ANYONE: You have insufficient $ANYONE tokens`,
          });
        } else if (!msg.includes('User denied transaction signature.')) {
          toast.add({
            icon: 'i-heroicons-x-circle',
            color: 'amber',
            title: 'Error',
            description: `Error unlocking ${formatEther(hodlerStore.lockSize || '0')} $ANYONE, did you approve the transaction?`,
          });
        } else {
          toast.add({
            icon: 'i-heroicons-x-circle',
            color: 'amber',
            title: 'Error',
            description: 'User denied transaction signature.',
          });
        }

        this.logger.error(ERRORS.FUNDING_ORACLE, error);
      }
      resolve(null);
    });
  }
}

let hodler: Hodler | null = null;
export const initHodler = async () => {
  const provider = useProvider();

  if (!hodler) {
    hodler = new Hodler(
      runtimeConfig.public.hodlerContract as string,
      provider,
      runtimeConfig.public.multicallContract as string // Add your multicall contract address here
    );
    await hodler.refresh();
  }
};
export const useHodler = () => hodler;
