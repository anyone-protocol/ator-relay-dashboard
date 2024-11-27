import {
  sendAosDryRun,
  sendAosMessage,
  type AosActionResult,
} from '~/utils/aos';
import Logger from '~/utils/logger';
import { createEthereumDataItemSigner } from '~/utils/create-ethereum-data-item-signer';
import type { OperatorRegistryState } from '~/types/operator-registry';
import { useAoSigner } from './ao-signer';

export class OperatorRegistry {
  private readonly logger = new Logger('OperatorRegistry');

  constructor(private readonly operatorRegistryProcessId: string) {}

  async claim(fingerprint: string): Promise<AosActionResult | null> {
    const signer = await useAoSigner();

    if (!signer) {
      this.logger.error('signer was null during claim()');
      return null;
    }

    const { messageId, result } = await sendAosMessage({
      processId: this.operatorRegistryProcessId,
      signer: (await createEthereumDataItemSigner(signer)) as any,
      tags: [
        { name: 'Action', value: 'Submit-Fingerprint-Certificate' },
        { name: 'Fingerprint-Certificate', value: fingerprint },
      ],
    });

    if (result.Error) {
      return { success: false, messageId, error: result.Error };
    }

    return { success: true, messageId };
  }

  async renounce(fingerprint: string): Promise<AosActionResult | null> {
    const signer = await useAoSigner();

    if (!signer) {
      this.logger.error('signer was null during renounce()');
      return null;
    }

    const { messageId, result } = await sendAosMessage({
      processId: this.operatorRegistryProcessId,
      signer: (await createEthereumDataItemSigner(signer)) as any,
      tags: [
        { name: 'Action', value: 'Renounce-Fingerprint-Certificate' },
        { name: 'Fingerprint', value: fingerprint },
      ],
    });

    if (result.Error) {
      return { success: false, messageId, error: result.Error };
    }

    return { success: true, messageId };
  }

  async viewState(): Promise<OperatorRegistryState> {
    const { result } = await sendAosDryRun({
      processId: this.operatorRegistryProcessId,
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
  }
}

const runtimeConfig = useRuntimeConfig();
const operatorRegistry = new OperatorRegistry(
  runtimeConfig.public.operatorRegistryProcessId
);

export const useOperatorRegistry = () => operatorRegistry;
