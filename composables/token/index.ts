import {
  AbstractProvider,
  BrowserProvider,
  Contract,
  JsonRpcSigner,
  TransactionResponse,
} from 'ethers';

import { abi } from './Token.json';
import Logger from '~/utils/logger';

const runtimeConfig = useRuntimeConfig();

const ERRORS = {
  NOT_INITIALIZED: 'Token is not initialized!',
  NO_PROVIDER: 'No Provider to initialize Token',
  NO_SIGNER: 'No Signer connected',
};

const logger = new Logger('Token');

export class Token {
  private contract!: Contract;
  private signer: JsonRpcSigner | null = null;

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
    this.contract = Token.buildContract(this.contractAddress, providerOrSigner);
  }

  async setSigner(signer?: JsonRpcSigner) {
    if (signer) {
      this.signer = signer;
      this.refreshContract(this.signer);
    } else {
      this.signer = null;
      this.refreshContract(useProvider());
    }
  }

  async approve(
    address: string,
    amount: bigint
  ): Promise<TransactionResponse | null> {
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
      this.contract.connect(this.signer);
      const currentAllowance = await this.allowance(
        this.signer.address,
        address
      );
      if (currentAllowance >= amount) {
        return null;
      }

      const result = await this.contract.approve(address, amount);

      await result.wait();

      return result;
    } catch (error) {
      logger.error('Error approving token', error);
      const msg = (error as Error)?.message;
      if (!msg.includes('User denied transaction signature.')) {
        toast.add({
          icon: 'i-heroicons-x-circle',
          color: 'amber',
          title: 'Error',
          description: `Error redeen rewards: ${msg}`,
        });
      }
    }

    return null;
  }

  async allowance(owner: string, spender: string): Promise<bigint> {
    if (!this.contract) {
      throw new Error(ERRORS.NOT_INITIALIZED);
    }
    try {
      return await this.contract.allowance(owner, spender);
    } catch (error) {
      logger.error('Error fetching allowance', error);
      return BigInt(0);
    }
  }
}

let token: Token | null = null;
export const initToken = async () => {
  const provider = useProvider();

  if (!token) {
    token = new Token(
      runtimeConfig.public.sepoliaAtorTokenContract as string,
      provider
    );
  }
};
export const useToken = () => token;
