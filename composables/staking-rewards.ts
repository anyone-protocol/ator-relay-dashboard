import Logger from '~/utils/logger';
import BigNumber from 'bignumber.js';
import type {
  GetRewardsResponse,
  LastRoundMetadata,
  LastSnapshot,
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
      const data: GetRewardsResponse = JSON.parse(
        result?.Messages[0]?.Data || '{}'
      );
      if (!data) return null;

      logger.info('stakingRewardsData: ', data);

      const operatorRewards: OperatorRewards[] = [];
      if (!Array.isArray(data.Rewarded) && Object.keys(data.Rewarded).length) {
        for (const operator in data.Rewarded) {
          const rewarded = BigNumber(data.Rewarded[operator] || '0');
          const claimed = BigNumber(data.Claimed[operator] || '0');
          const redeemable = rewarded.minus(claimed);
          // logger.info('rewarded: ', rewarded.toString());
          // logger.info('claimed: ', claimed.toString());
          // logger.info('redeemable: ', redeemable.toString());
          operatorRewards.push({
            operator: `0x${operator.slice(2).toUpperCase()}`, // Normalize operator address
            redeemable: redeemable.toString(),
          });
        }
      }

      // logger.info('opRewards: ', operatorRewards);

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
      const data: GetRewardsResponse = JSON.parse(result?.Messages[0]?.Data);
      logger.info('stakingRewardsData: ', data);
      let totalClaimable = BigNumber(0);

      if (!Array.isArray(data.Rewarded) && Object.keys(data.Rewarded).length) {
        for (const operator in data.Rewarded) {
          // logger.info({
          //   operator: operator,
          //   rewarded: data.Rewarded[operator],
          // });
          const rewarded = BigNumber(data.Rewarded[operator] || '0');
          const claimed = BigNumber(data.Claimed[operator] || '0');
          const claimable = rewarded.minus(claimed);
          totalClaimable = totalClaimable.plus(claimable);
        }
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
      logger.info('Last round metadata: ', data);
      return data;
    } catch (error) {
      logger.error('Error fetching last round metadata', error);
      return null;
    }
  };

  const getLastSnapshot = async () => {
    try {
      const { result } = await sendAosDryRun({
        processId,
        tags: [{ name: 'Action', value: 'Last-Snapshot' }],
      });

      if (!result || !result.Messages || result.Messages.length === 0) {
        logger.error('No messages found in the result');
        return null;
      }

      const data: LastSnapshot = JSON.parse(result.Messages[0].Data);
      logger.info('Last snapshot: ', data);
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
      logger.info('Staking rewards state: ', data);
      return data;
    } catch (error) {
      logger.error('Error fetching last round metadata', error);
      return null;
    }
  };

  const runtimeConfig = useRuntimeConfig();
  const stakingSnapshotController =
    runtimeConfig.public.stakingSnapshotController;

  const arweave = useArweave();
  const queryObject = {
    query: `{
		transactions(
			first:2,
      owners: ["${stakingSnapshotController}"],
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
      const snapshotId = results.data.data.transactions.edges[0]?.node.id;

      if (!snapshotId) {
        throw new Error('No snapshot ID found.');
      }

      const snapshotRes = await arweave.api.get(`/${snapshotId}`);
      if (snapshotRes.ok) {
        const snapshotData: StakingSnapshot = snapshotRes.data;
        logger.info('Staking snapshot data:', snapshotData);
        return snapshotData;
      }

      logger.info('Snapshot not found. Fetching fallback...');

      const fallbackSnapshotId =
        results.data.data.transactions.edges[1]?.node.id;
      if (!fallbackSnapshotId) {
        throw new Error('No fallback snapshot ID found.');
      }
      const fallbackSnapshotRes = await arweave.api.get(
        `/${fallbackSnapshotId}`
      );
      if (!fallbackSnapshotRes.ok) {
        throw new Error('Fallback snapshot request failed.');
      }
      const fallbackSnapshotData: StakingSnapshot = fallbackSnapshotRes.data;
      logger.info('Fallback staking snapshot data:', fallbackSnapshotData);
      return fallbackSnapshotData;
    } catch (error) {
      logger.error('Error fetching staking snapshot:', error);
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
    getLastSnapshot,
    getStakingRewardsState,
    getStakingSnapshot,
    claimStakingRewards,
  };
};
