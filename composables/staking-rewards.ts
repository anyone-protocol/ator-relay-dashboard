import Logger from '~/utils/logger';
import BigNumber from 'bignumber.js';
import type {
  GetRewardsResponse,
  OperatorRewards,
} from '~/types/staking-rewards';

export const useStakingRewards = () => {
  const config = useRuntimeConfig();
  const processId = config.public.stakingRewardsProcessId;
  const logger = new Logger('StakingRewards');

  const getClaimableStakingRewards = async (
    address: string
  ): Promise<OperatorRewards[] | null> => {
    try {
      const { result } = await sendAosDryRun({
        processId,
        tags: [
          { name: 'Action', value: 'Get-Rewards' },
          { name: 'Address', value: address },
        ],
      });
      const data: GetRewardsResponse = result?.Messages[0]?.Data;
      if (!data) return null;

      const operatorRewards: OperatorRewards[] = [];
      for (const operator in data.Rewarded) {
        const rewarded = BigNumber(data.Rewarded[operator] || '0');
        const claimed = BigNumber(data.Claimed[operator] || '0');
        const redeemable = rewarded.minus(claimed);
        operatorRewards.push({
          operator: `0x${operator.slice(2).toUpperCase()}`, // Normalize operator address
          redeemable: redeemable.toString(),
        });
      }

      return operatorRewards;
    } catch (error) {
      logger.error('Error fetching claimable rewards', error);
      return null;
    }
  };

  const getTotalClaimableStakingRewards = async (address: string) => {
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
      logger.error(`Error fetching total claimable rewards`, error);
    }

    return null;
  };

  return {
    getClaimableStakingRewards,
    getTotalClaimableStakingRewards,
    claimStakingRewards,
  };
};
