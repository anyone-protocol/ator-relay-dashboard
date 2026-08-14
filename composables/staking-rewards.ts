import Logger from '~/utils/logger';
import { eip55, sameAddress } from '~/utils/eip55';
import BigNumber from 'bignumber.js';
import type {
  GetRewardsResponse,
  LastRoundMetadata,
  LastSnapshot,
  OperatorRewards,
  StakingRewardsState,
  StakingSnapshot,
} from '~/types/staking-rewards';
import { computed } from 'vue';

export const useStakingRewards = () => {
  const config = useRuntimeConfig();
  const logger = new Logger('StakingRewards');

  /**
   * Both paths now receive the SAME `{ Rewarded, Claimed }` shape — the legacy `Get-Rewards`
   * dry-run and the native `as/rewards` view — so they share one parser instead of two that
   * disagreed. The old hyperbeam branch treated each value as redeemable directly, with no
   * Claimed subtraction, which would report already-claimed rewards as still claimable.
   *
   * Operator keys are canonical EIP-55, which is what the contracts store and return.
   */
  const parseOperatorRewards = (
    data: GetRewardsResponse | null
  ): OperatorRewards[] => {
    const operatorRewards: OperatorRewards[] = [];
    if (!data || Array.isArray(data.Rewarded) || !data.Rewarded) {
      return operatorRewards;
    }
    for (const operator in data.Rewarded) {
      const rewarded = BigNumber(data.Rewarded[operator] || '0');
      const claimed = BigNumber(
        (Array.isArray(data.Claimed) ? undefined : data.Claimed?.[operator]) ||
          '0'
      );
      operatorRewards.push({
        operator: eip55(operator),
        redeemable: rewarded.minus(claimed).toString(),
      });
    }
    return operatorRewards;
  };

  const fetchStakingRewardsHyperbeam = async (
    address: string
  ): Promise<GetRewardsResponse | null> => {
    const { readView } = useHyperbeamRead();
    // Staking rewards come from the STAKING contract. The previous hyperbeam code read them
    // from the relay-rewards process, whose `rewards` view answers a single cumulative scalar
    // rather than the per-operator breakdown this screen renders.
    return await readView<GetRewardsResponse>(
      config.public.stakingRewardsHyperbeamProcessId,
      'rewards',
      { address }
    );
  };

  const getClaimableStakingRewardsHyperbeam = async (
    address: string
  ): Promise<OperatorRewards[] | null> => {
    try {
      return parseOperatorRewards(await fetchStakingRewardsHyperbeam(address));
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
      return await getClaimableStakingRewardsHyperbeam(address);
    } catch (error) {
      logger.error('Error fetching claimable rewards', error);
      return null;
    }
  };

  const getTotalClaimableStakingRewardsHyperbeam = async (address: string) => {
    try {
      const rewards = parseOperatorRewards(
        await fetchStakingRewardsHyperbeam(address)
      );
      return rewards
        .reduce((sum, r) => sum.plus(BigNumber(r.redeemable)), BigNumber(0))
        .toString();
    } catch (error) {
      logger.error('Error fetching total staking rewards via hyperbeam', error);
      return null;
    }
  };

  const getTotalClaimableStakingRewards = async (address: string) => {
    try {
      return await getTotalClaimableStakingRewardsHyperbeam(address);
    } catch (error) {
      logger.error('Error fetching claimable rewards', error);
      return null;
    }
  };

  const getLastSnapshot = async () => {
    try {
      const { readView } = useHyperbeamRead();
      return await readView<LastSnapshot>(
        config.public.stakingRewardsHyperbeamProcessId,
        'last_snapshot'
      );
    } catch (error) {
      logger.error('Error fetching last round metadata', error);
      return null;
    }
  };

  const getStakingRewardsState = async () => {
    try {
      // `View-State` pulled the whole contract; `dump` is the runtime-owned equivalent and is
      // the only whole-state read that still exists. Callers wanting one hodler should use
      // `rewards` / `claimed` / `shares` instead.
      const { readView } = useHyperbeamRead();
      return await readView<LastSnapshot>(
        config.public.stakingRewardsHyperbeamProcessId,
        'dump'
      );
    } catch (error) {
      logger.error('Error fetching staking rewards state', error);
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

  // NOTE: there is deliberately no AO claim here.
  //
  // Users claim by sending an EVM transaction to the Hodler contract (Facilitator on the legacy
  // path); facilitator-controller then performs the AO write, which is why IT — not the user —
  // holds the Claim-Rewards role on both reward contracts. A browser-signed AO `Claim-Rewards`
  // is rejected by the same ACL on legacynet and on the native port, so the previous
  // implementation could never have succeeded. See composables/hodler `claim()`.

  return {
    getClaimableStakingRewards,
    getTotalClaimableStakingRewards,
    getLastSnapshot,
    getStakingSnapshot,
    getStakingRewardsState,
  };
};
