import { sendAosDryRun, sendAosMessage, type MessageResult } from '~/utils/aos';
import Logger from '~/utils/logger';
import { useAoSigner } from './ao-signer';
import { createEthereumDataItemSigner } from '~/utils/create-ethereum-data-item-signer';

export type OperatorRegistryState = {
  ClaimableFingerprintsToOperatorAddresses: { [fingerprint: string]: string };
  VerifiedFingerprintsToOperatorAddresses: { [fingerprint: string]: string };
  BlockedOperatorAddresses: { [address: string]: true };
  RegistrationCreditsFingerprintsToOperatorAddresses: {
    [fingerprint: string]: string;
  };
  VerifiedHardwareFingerprints: { [fingerprint: string]: true };
};
export type GetRelayInfoResult = {
  claimable: string[];
  verified: string[];
  registrationCredits: string[];
  verifiedHardware: string[];
};

export class OperatorRegistry {
  private readonly logger = new Logger('OperatorRegistry');

  constructor(private readonly processId: string) {}

  async viewState(): Promise<OperatorRegistryState | null> {
    try {
      const { result } = await sendAosDryRun({
        processId: this.processId,
        tags: [{ name: 'Action', value: 'View-State' }],
      });
      const state = JSON.parse(result.Messages[0].Data);

      for (const prop in state) {
        // NB: Lua returns empty tables as JSON arrays, so we normalize them to
        //     empty objects as when they are populated they will also be objects
        if (Array.isArray(state[prop]) && state[prop].length < 1) {
          state[prop] = {};
        }
      }

      return state;
    } catch (error) {
      this.logger.error('Error fetching Operator Registry State', error);
    }

    return null;
  }

  async getRelayInfoForAddress(address: string): Promise<GetRelayInfoResult> {
    this.logger.info(`getRelayInfoForAddress`, address);

    const state = await this.viewState();

    if (!state) {
      return {
        claimable: [],
        verified: [],
        registrationCredits: [],
        verifiedHardware: [],
      };
    }

    this.logger.info(`Got state`, state);

    const allcapsAddress = '0x' + address.substring(2).toUpperCase();

    const claimable = Object.entries(
      state.ClaimableFingerprintsToOperatorAddresses
    )
      .filter(([_fingerprint, relayAddress]) => relayAddress === allcapsAddress)
      .map(([fingerprint]) => fingerprint);

    const verified = Object.entries(
      state.VerifiedFingerprintsToOperatorAddresses
    )
      .filter(([_fingerprint, relayAddress]) => relayAddress === allcapsAddress)
      .map(([fingerprint]) => fingerprint);

    const registrationCredits = Object.entries(
      state.RegistrationCreditsFingerprintsToOperatorAddresses
    )
      .filter(([_fingerprint, relayAddress]) => relayAddress === allcapsAddress)
      .map(([fingerprint]) => fingerprint);

    const verifiedHardware = Object.keys(
      state.VerifiedHardwareFingerprints
    ).filter(
      (fingerprint) =>
        claimable.includes(fingerprint) || verified.includes(fingerprint)
    );

    const relayInfo = {
      claimable,
      verified,
      registrationCredits,
      verifiedHardware,
    };

    this.logger.info(`Relay info for ${address}`, relayInfo);

    return relayInfo;
  }

  async claim(
    fingerprint: string
  ): Promise<{ messageId: string; result: MessageResult } | null> {
    try {
      const signer = await useAoSigner();

      if (!signer) {
        this.logger.error('Signer is null during claim');

        return null;
      }

      const { messageId, result } = await sendAosMessage({
        processId: this.processId,
        signer: createEthereumDataItemSigner(signer, true) as any,
        tags: [
          { name: 'Action', value: 'Submit-Fingerprint-Certificate' },
          { name: 'Fingerprint-Certificate', value: fingerprint },
          { name: 'UI-Cache-Key', value: `claim-${Date.now().toString()}` },
        ],
      });

      return { messageId, result };
    } catch (error) {
      this.logger.error(`Error claiming fingerprint ${fingerprint}`, error);
    }

    return null;
  }

  async renounce(
    fingerprint: string
  ): Promise<{ messageId: string; result: MessageResult } | null> {
    try {
      const signer = await useAoSigner();

      if (!signer) {
        this.logger.error('Signer is null during claim');

        return null;
      }

      const { messageId, result } = await sendAosMessage({
        processId: this.processId,
        signer: createEthereumDataItemSigner(signer, true) as any,
        tags: [
          { name: 'Action', value: 'Renounce-Fingerprint-Certificate' },
          { name: 'Fingerprint', value: fingerprint },
          { name: 'UI-Cache-Key', value: `renounce-${Date.now().toString()}` },
        ],
      });

      return { messageId, result };
    } catch (error) {
      this.logger.error(`Error renouncing fingerprint ${fingerprint}`, error);
    }

    return null;
  }
}

const config = useRuntimeConfig();
const operatorRegistry = new OperatorRegistry(
  config.public.operatorRegistryProcessId
);
export const useOperatorRegistry = () => operatorRegistry;
