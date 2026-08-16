import Logger from '~/utils/logger';
import { eip55, sameAddress } from '~/utils/eip55';
import BigNumber from 'bignumber.js';
import type {
  GetRewardsResponse,
  LastRoundMetadata,
  LastSnapshot,
  OperatorRewards,
  StakingRewardsState,
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

  /**
   * Per-operator stake and running ratio, derived from the round snapshot the contract already
   * serves.
   *
   * This replaces a read of the `staking/snapshot` Arweave publication. That publication is
   * derived data the controller assembled, it fails silently often enough that nobody noticed,
   * and reading it made the dashboard depend on a gateway for something the contract holds. Both
   * values the staking page needs are already in `as/last_snapshot`, which the page fetches
   * anyway for the running threshold, so this costs no extra request.
   *
   * 🚨 `Details` is keyed `[hodler][operator]`, NOT `[operator][hodler]` — the contract builds it
   * from a `hodler/operator` pair key. Reading it the other way round silently produces
   * plausible-looking but wrong totals, so the stake for an operator is a SUM over hodlers.
   *
   * `Running` is a property of the OPERATOR, so every hodler staking to it carries the same
   * value; taking the max is just a safe way to pick one. Verified across a live round: 19
   * hodlers, 17 operators, zero disagreement.
   */
  const deriveOperatorStakes = (snapshot: LastSnapshot | null | undefined) => {
    const stakes: Record<`0x${string}`, bigint> = {};
    const running: Record<`0x${string}`, number> = {};
    if (!snapshot) return { stakes, running };

    for (const hodler in snapshot.Details ?? {}) {
      const perOperator = snapshot.Details[hodler as `0x${string}`];
      for (const operator in perOperator) {
        const score = perOperator[operator as `0x${string}`]?.Score;
        if (!score) continue;
        const key = eip55(operator) as `0x${string}`;
        stakes[key] = (stakes[key] ?? 0n) + BigInt(score.Staked || '0');
        running[key] = Math.max(running[key] ?? 0, Number(score.Running) || 0);
      }
    }

    // `Network` carries the raw relay counts the ratio above was computed from. Optional: a round
    // settled before the contract gained the field has none, and the ratio still drives the badge.
    //
    // Where it IS present it takes precedence, because it also covers operators with NO stake.
    // Those never appear in Details, so the ratio alone cannot see them and they would otherwise
    // read as not-running — which is exactly wrong for a new operator with relays up.
    //
    // Only the ratio is taken here. The counts themselves are deliberately not surfaced: nothing
    // in the UI displays them, and the round record in the contract is where they belong.
    const network = snapshot.Network ?? {};
    for (const operator in network) {
      const c = network[operator as `0x${string}`];
      if (!c) continue;
      running[eip55(operator) as `0x${string}`] =
        c.Expected > 0 ? Math.min(c.Running / c.Expected, 1) : 0;
    }

    return { stakes, running };
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
    deriveOperatorStakes,
    getStakingRewardsState,
  };
};
