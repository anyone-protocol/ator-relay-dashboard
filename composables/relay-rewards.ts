import Logger from '~/utils/logger';

export class RelayRewards {
  private readonly logger = new Logger('RelayRewards');

  constructor(private readonly processId: string) {}

  async getClaimable(address: string): Promise<string | null> {
    try {
      const { result } = await sendAosDryRun({
        processId: this.processId,
        tags: [
          { name: 'Action', value: 'Get-Rewards' },
          { name: 'Address', value: address },
        ],
      });

      return result.Messages[0].Data;
    } catch (error) {
      this.logger.error('Error fetching claimable rewards', error);
    }

    return null;
  }
}

const config = useRuntimeConfig();
const relayRewards = new RelayRewards(config.public.relayRewardsProcessId);
export const useOperatorRegistry = () => relayRewards;
