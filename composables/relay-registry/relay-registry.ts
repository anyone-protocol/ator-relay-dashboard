import type { Contract, WriteInteractionResponse } from 'warp-contracts';
import type { Claim, RelayRegistryState, Renounce } from './';
import Logger from '~/utils/logger';

import { relayRegistryContract } from '@/config/warp.config';

export class RelayRegistry {
  private contract: Contract<RelayRegistryState> | null = null;
  private _isInitialized: boolean = false;
  private readonly logger = new Logger('RelayRegistry');

  get isInitialized() {
    return this._isInitialized;
  }

  initialize(contract: Contract<RelayRegistryState>) {
    if (this._isInitialized) {
      return;
    }

    this.contract = contract;
    this._isInitialized = true;
  }

  async claim(fingerprint: string): Promise<WriteInteractionResponse | null> {
    this.logger.info(`Claiming fingerprint ${fingerprint}`);
    const toast = useToast();

    if (!this.contract) {
      this.logger.error('claim() relay registry contract is null');
      return null;
    }

    const auth = useUserStore();
    if (!auth.userData.address) {
      this.logger.error('Not logged in.');
      return null;
    }

    if (!(await auth.hasRegistrationCredit(fingerprint))) {
      this.logger.error('No registration credit for this fingerprint.');
      toast.add({
        id: 'no-registration-credit',
        icon: 'i-heroicons-information-circle',
        title: 'Error',
        description:
          'You do not have a registration credit for this fingerprint.',
        color: 'amber',
      });
      return null;
    }

    const warpSigner = await useWarpSigner();
    if (!warpSigner) {
      this.logger.error('claim() relay registry warpSigner is null');
      return null;
    }

    return (
      this.contract
        /* @ts-expect-error warp types */
        .connect(warpSigner)
        .writeInteraction<Claim>({ function: 'claim', fingerprint })
    );
  }

  async renounce(
    fingerprint: string
  ): Promise<WriteInteractionResponse | null> {
    this.logger.info(`Renouncing fingerprint ${fingerprint}`);

    if (!this.contract) {
      this.logger.error('renounce() relay registry contract is null');
      return null;
    }

    const warpSigner = await useWarpSigner();
    if (!warpSigner) {
      this.logger.error('renounce() relay registry warpSigner is null');
      return null;
    }

    return (
      this.contract
        /* @ts-expect-error warp types */
        .connect(warpSigner)
        .writeInteraction<Renounce>({ function: 'renounce', fingerprint })
    );
  }
}

const relayRegistry = new RelayRegistry();
export const initRelayRegistry = (): Promise<void> => {
  return new Promise((resolve) => {
    if (relayRegistry.isInitialized) {
      // If already initialized, resolve immediately
      resolve();
      return;
    }

    relayRegistry.initialize(relayRegistryContract);
    resolve(); // Resolve after initialization
  });
};
export const useRelayRegistry = () => relayRegistry;
