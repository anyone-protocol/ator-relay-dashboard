import { createAoClient } from '@anyone-protocol/ao-client';
import Logger from '~/utils/logger';
import { useAoSigner } from './ao-signer';
import { readContractView } from './useHyperbeamRead';

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

  constructor(
    private readonly processId: string,
    private readonly hyperbeamUrl: string
  ) {}

  /**
   * A signing client for the two writes below.
   *
   * `AoSigner` already extends arbundles' `InjectedEthereumSigner`, so ao-client takes it
   * directly — the write path is a transport swap, not a re-signing. aoconnect only ever
   * carried the item, and its silent endpoint defaults are the reason it is gone: ao-client
   * requires an explicit node url and never defaults one.
   */
  private async signingClient() {
    const signer = await useAoSigner();
    if (!signer) {
      this.logger.error('Signer is null — wallet not connected or rejected');
      return null;
    }
    return createAoClient({ url: this.hyperbeamUrl, signer: signer as any });
  }

  /**
   * One operator's registry entry, in ONE request.
   *
   * This replaces a `View-State` dry-run that pulled the WHOLE registry (~2 MB on stage:
   * 22,599 claimable + 593 verified + 658 hardware) to answer a question about a single
   * address — the over-fetch the contract's own comments call out. `as/operator` answers it
   * directly, so `viewState` is gone rather than ported: nothing else used it.
   *
   * Each set-valued field is a map of fingerprint -> true when populated and `[]` when empty,
   * because the Lua encoder cannot tell an empty object from an empty array.
   */
  async getRelayInfoForAddress(address: string): Promise<GetRelayInfoResult> {
    const empty: GetRelayInfoResult = {
      claimable: [],
      verified: [],
      registrationCredits: [],
      verifiedHardware: [],
    };

    try {
      const entry = await readContractView<{
        claimable: Record<string, boolean> | [];
        verified: Record<string, boolean> | [];
        registrationCredits: Record<string, boolean> | [];
        hardware: Record<string, boolean> | [];
      }>(this.hyperbeamUrl, this.processId, 'operator', { address });

      const keys = (v: unknown): string[] =>
        v && typeof v === 'object' && !Array.isArray(v)
          ? Object.keys(v as Record<string, unknown>)
          : [];

      return {
        claimable: keys(entry.claimable),
        verified: keys(entry.verified),
        registrationCredits: keys(entry.registrationCredits),
        // `hardware` is this view's name for what the dashboard calls verifiedHardware
        verifiedHardware: keys(entry.hardware),
      };
    } catch (error) {
      this.logger.error(`Error fetching relay info for ${address}`, error);
      return empty;
    }
  }

  async claim(fingerprint: string) {
    try {
      const ao = await this.signingClient();
      if (!ao) return null;

      return await ao.sendMessage({
        processId: this.processId,
        action: 'Submit-Fingerprint-Certificate',
        // Tag names MUST be lowercase: ao-client rejects anything else for the ans104
        // round-trip, and the runtime title-cases them back (`foldTags`), so the contract still
        // reads `ctx.tags['Fingerprint-Certificate']`. aoconnect happened to tolerate the
        // title-cased form on the way out, which is why these carried it.
        tags: [
          { name: 'fingerprint-certificate', value: fingerprint },
          { name: 'ui-cache-key', value: `claim-${Date.now().toString()}` },
        ],
      });
    } catch (error) {
      this.logger.error(`Error claiming fingerprint ${fingerprint}`, error);
    }

    return null;
  }

  async renounce(fingerprint: string) {
    try {
      const ao = await this.signingClient();
      if (!ao) return null;

      return await ao.sendMessage({
        processId: this.processId,
        action: 'Renounce-Fingerprint-Certificate',
        tags: [
          { name: 'fingerprint', value: fingerprint },
          { name: 'ui-cache-key', value: `renounce-${Date.now().toString()}` },
        ],
      });
    } catch (error) {
      this.logger.error(`Error renouncing fingerprint ${fingerprint}`, error);
    }

    return null;
  }
}

const config = useRuntimeConfig();
const operatorRegistry = new OperatorRegistry(
  config.public.operatorRegistryHyperbeamProcessId,
  config.public.hyperbeamUrl
);
export const useOperatorRegistry = () => operatorRegistry;
