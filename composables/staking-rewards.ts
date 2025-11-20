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
  const featureFlags = useFeatureFlags();
  const isHyperbeamEnabled = computed(() =>
    featureFlags.getFlag('experimentalHyperbeam')
  );

  const getClaimableStakingRewardsHyperbeam = async (
    address: string
  ): Promise<OperatorRewards[] | null> => {
    try {
      const hyperbeamUrl = config.public.hyperbeamUrl;
      const processId = config.public.relayRewardsHyperbeamProcessId;
      const scriptTxId = config.public.relayDynamicViews;
      const url = `${hyperbeamUrl}/${processId}~process@1.0/now/~lua@5.3a&module=${scriptTxId}/get_rewards?address=${`0x${address.slice(2).toUpperCase()}` as `0x${string}`}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch staking rewards: ${response.statusText}`
        );
      }

      const data = await response.json();
      logger.info('stakingRewardsDataHyperbeam: ', data);

      // Parse hyperbeam response format
      const operatorRewards: OperatorRewards[] = [];
      if (data && typeof data === 'object') {
        for (const operator in data) {
          const redeemable = new BigNumber(data[operator] || '0');
          if (redeemable.gt(0)) {
            operatorRewards.push({
              operator: `0x${operator.slice(2).toUpperCase()}`,
              redeemable: redeemable.toString(),
            });
          }
        }
      }

      return operatorRewards;
    } catch (error) {
      logger.error(
        'Error fetching claimable staking rewards via hyperbeam',
        error
      );
      return null;
    }
  };

  const getClaimableStakingRewards = async (
    address: string
  ): Promise<OperatorRewards[] | null> => {
    try {
      if (isHyperbeamEnabled.value) {
        return await getClaimableStakingRewardsHyperbeam(address);
      }

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

  const getTotalClaimableStakingRewardsHyperbeam = async (address: string) => {
    try {
      const hyperbeamUrl = config.public.hyperbeamUrl;
      const processId = config.public.relayRewardsHyperbeamProcessId;
      const scriptTxId = config.public.relayDynamicViews;
      const url = `${hyperbeamUrl}/${processId}~process@1.0/now/~lua@5.3a&module=${scriptTxId}/get_rewards?address=${`0x${address.slice(2).toUpperCase()}` as `0x${string}`}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch total staking rewards: ${response.statusText}`
        );
      }

      const data = await response.json();
      logger.info('totalStakingRewardsDataHyperbeam: ', data);

      let totalClaimable = new BigNumber(0);
      if (data && typeof data === 'object') {
        for (const operator in data) {
          const redeemable = new BigNumber(data[operator] || '0');
          totalClaimable = totalClaimable.plus(redeemable);
        }
      }

      return totalClaimable.toString();
    } catch (error) {
      logger.error('Error fetching total staking rewards via hyperbeam', error);
      return null;
    }
  };

  const getTotalClaimableStakingRewards = async (address: string) => {
    try {
      if (isHyperbeamEnabled.value) {
        return await getTotalClaimableStakingRewardsHyperbeam(address);
      }

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

  const runtimeConfig = useRuntimeConfig();
  const stakingSnapshotController =
    runtimeConfig.public.stakingSnapshotController;

  const arweave = useArweave();
  const queryObject = {
    query: `{
		transactions(
			first:10,
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
      const edges = results.data.data.transactions.edges;

      if (!edges || edges.length === 0) {
        throw new Error('No transactions found.');
      }

      for (let i = 0; i < Math.min(10, edges.length); i++) {
        const snapshotId = edges[i].node.id;
        const snapshotRes = await arweave.api.get(`/${snapshotId}`);
        if (snapshotRes.ok) {
          const snapshotData: StakingSnapshot = snapshotRes.data;
          logger.info(`Staking snapshot data from edge ${i}:`, snapshotData);
          return snapshotData;
        }
      }

      throw new Error('No valid snapshot found in the first 10 edges.');
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
    getLastSnapshot,
    getStakingSnapshot,
    claimStakingRewards,
  };
};
