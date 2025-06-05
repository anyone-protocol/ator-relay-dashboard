import Logger from '~/utils/logger';
import BigNumber from 'bignumber.js';
import type {
  GetRewardsResponse,
  LastRoundMetadata,
  OperatorRewards,
  StakingRewardsState,
  StakingSnapshot,
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

  const getLastRoundMetadata = async () => {
    try {
      const { result } = await sendAosDryRun({
        processId,
        tags: [{ name: 'Action', value: 'Last-Round-Metadata' }],
      });

      if (!result || !result.Messages || result.Messages.length === 0) {
        logger.error('No messages found in the result');
        return null;
      }

      const data: LastRoundMetadata = JSON.parse(result.Messages[0].Data);
      console.log('Last round metadata: ', data);
      return data;
    } catch (error) {
      logger.error('Error fetching last round metadata', error);
      return null;
    }
  };

  const getStakingRewardsState = async () => {
    try {
      const { result } = await sendAosDryRun({
        processId,
        tags: [{ name: 'Action', value: 'View-State' }],
      });

      if (!result || !result.Messages || result.Messages.length === 0) {
        logger.error('No messages found in the result');
        return null;
      }

      const data: StakingRewardsState = JSON.parse(result.Messages[0].Data);
      console.log('Staking rewards state: ', data);
      return data;
    } catch (error) {
      logger.error('Error fetching last round metadata', error);
      return null;
    }
  };

  const arweave = useArweave();
  const queryObject = {
    query: `{
		transactions(
			first:1,
			tags: [
				{
					name: "Protocol",
					values: ["ANyONe"]
				},
				{
					name: "Protocol-Version",
					values: ["0.2"]
				},
				{
					name: "Content-Type",
					values: ["application/json"]
				},
				{
					name: "Entity-Type",
					values: ["staking/snapshot"]
				}
			]
		) 
		{
			edges {
				node {
					id
					tags {
						name
						value
					}
				}
			}
		}
	}`,
  };

  const getStakingSnapshot = async () => {
    try {
      const results = await arweave.api.post('/graphql', queryObject);
      // console.log('Staking snapshot results:', results);
      const snapshotId = results.data.data.transactions.edges[0]?.node.id;

      const snapshotRes = await arweave.api.get(`/${snapshotId}/data`);
      const snapshotData: StakingSnapshot = snapshotRes.data;
      console.log('Staking snapshot data:', snapshotData);
      return snapshotData;
    } catch (error) {
      console.error('Error fetching staking snapshot:', error);
      throw error;
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
    getLastRoundMetadata,
    getStakingRewardsState,
    getStakingSnapshot,
    claimStakingRewards,
  };
};
