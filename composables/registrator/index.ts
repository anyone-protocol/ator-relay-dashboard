import {
  AbstractProvider,
  BrowserProvider,
  Contract,
  JsonRpcSigner,
  TransactionResponse,
} from 'ethers';

import { abi } from './Registrator.json';
import { useRegistratorStore } from '@/stores/useRegistratorStore';
import { initToken, useToken } from '../token';

const runtimeConfig = useRuntimeConfig();

const ERRORS = {
  NOT_INITIALIZED: 'Registrator is not initialized!',
  CONNECTING_CONTRACT:
    'There was an error connecting to the Registrator Contract',
  CLAIMING_TOKENS: 'Error claiming tokens',
  COULD_NOT_FUND_ORACLE: 'Could not fund Oracle',
  FUNDING_ORACLE: 'Error funding Oracle',
  REQUESTING_UPDATE: 'Error requesting update from Registrator',
  REQUESTING_UPDATE_NOT_SUCCESSFUL:
    'Requesting update from Registrator was not successful',
  RECEIVE_AND_REQUEST_UPDATE:
    'Error funding & requesting update from Registrator',
  NO_PROVIDER: 'No Provider to initialize Registrator',
  NO_SIGNER: 'No Signer connected',
};

export class Registrator {
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
    this.contract = Registrator.buildContract(
      this.contractAddress,
      providerOrSigner
    );
  }

  async setSigner(signer?: JsonRpcSigner) {
    if (signer) {
      this.signer = signer;
      this.refreshContract(this.signer);
    } else {
      this.signer = null;
      this.refreshContract(useProvider());
    }
    return this.refresh();
  }

  private setRefreshing(refreshing: boolean) {
    useState<boolean>('registrator-refreshing').value = refreshing;
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
        ? `Refreshing Registrator for ${auth.userData?.address}`
        : 'Refreshing Registrator'
    );
    console.time();

    let lockedRelays = null,
      currentLockSize = null;

    if (auth.userData?.address) {
      lockedRelays = await this.getLokedRelaysTokens(auth.userData.address);
      currentLockSize = await this.getCurrentLockSize(auth.userData.address);
    }

    console.timeEnd();
    console.info('Registrator refreshed', {
      lockedRelays: lockedRelays,
      currentLockSize: currentLockSize,
    });
    this.setRefreshing(false);
  }

  async getLokedRelaysTokens(address: string): Promise<string[]> {
    if (!this.contract) {
      throw new Error(ERRORS.NOT_INITIALIZED);
    }

    const lokedRelays = (await this.contract.getRegistration(address)) as {
      data: string[];
    };

    if (address === useUserStore().userData?.address) {
      useRegistratorStore().lokedRelays = lokedRelays.data;
    }

    return lokedRelays.data;
  }

  async getCurrentLockSize(address: string): Promise<bigint> {
    if (!this.contract) {
      throw new Error(ERRORS.NOT_INITIALIZED);
    }

    const currentLockSize = (await this.contract.currentLockSize()) as bigint;

    if (address === useUserStore().userData?.address) {
      useRegistratorStore().currentLockSize = currentLockSize;
    }

    return currentLockSize;
  }

  async lock(fingerprint: string): Promise<TransactionResponse | null> {
    const auth = useUserStore();
    const registratorStore = useRegistratorStore();

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
    if (!this.contract || !registratorStore.currentLockSize) {
      throw new Error(ERRORS.NOT_INITIALIZED);
    }

    const toast = useToast();

    try {
      const token = useToken();
      if (!token) {
        throw new Error(ERRORS.NOT_INITIALIZED);
      }
      debugger;

      const tokenResult = await token.approve(
        runtimeConfig.public.registratorContract as string,
        registratorStore.currentLockSize
      );
      await tokenResult?.wait();
      debugger;
      const result = await this.contract
        .connect(this.signer)
        // @ts-ignore
        .register(auth.userData.address, fingerprint);

      await result.wait();
      const block = await result.getBlock();
      const timestamp = block?.timestamp || Math.floor(Date.now() / 1000);
      useRegistratorStore().lockRelay(fingerprint);

      return result;
    } catch (error) {
      debugger;

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
}

let registrator: Registrator | null = null;
export const initRegistrator = async () => {
  const provider = useProvider();

  if (!registrator) {
    registrator = new Registrator(
      runtimeConfig.public.registratorContract as string,
      provider
    );
    await registrator.refresh();
  }
};
export const useRegistrator = () => registrator;
