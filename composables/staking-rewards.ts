import Logger from '~/utils/logger';
import BigNumber from 'bignumber.js';

interface GetRewardsResponse {
  Rewarded: Record<string, string>;
  Claimed: Record<string, string>;
}

export const useStakingRewards = () => {
  const config = useRuntimeConfig();
  const processId = config.public.stakingRewardsProcessId;
  const logger = new Logger('StakingRewards');

  const getClaimableStakingRewards = async (address: string) => {
    try {
      const { result } = await sendAosDryRun({
        processId,
        tags: [
          { name: 'Action', value: 'Get-Rewards' },
          { name: 'Address', value: address },
        ],
      });
      const data: GetRewardsResponse = result?.Messages[0]?.Data;
      console.log('stakingRewardsData: ', data);
      let totalClaimable = BigNumber(0);

      // iterate over operators to calculate claimable amount
      for (const operator in data.Rewarded) {
        const rewarded = BigNumber(data.Rewarded[operator] || '0');
        const claimed = BigNumber(data.Claimed[operator] || '0');
        const claimable = rewarded.minus(claimed);
        totalClaimable = totalClaimable.plus(claimable);
      }

      return totalClaimable.toString();
    } catch (error) {
      logger.error('Error fetching claimable rewards', error);
      return null;
    }
  };

  const claimStakingRewards = async (
    address: string
  ): Promise<{ messageId: string; result: MessageResult } | null> => {
    try {
      const signer = await useAoSigner();

      if (!signer) {
        logger.error('Signer is null during claim');
        return null;
      }

      const { messageId, result } = await sendAosMessage({
        processId,
        signer: createEthereumDataItemSigner(signer, true) as any,
        tags: [
          { name: 'Action', value: 'Claim-Rewards' },
          { name: 'Address', value: address },
        ],
      });

      return { messageId, result };
    } catch (error) {
      logger.error(`Error claiming staking rewards`, error);
    }

    return null;
  };

  return {
    getClaimableStakingRewards,
    claimStakingRewards,
  };
};
