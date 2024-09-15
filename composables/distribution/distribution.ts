import { type Contract } from 'warp-contracts';
import BigNumber from 'bignumber.js';
import moment from 'moment';

import { type Claimable } from '@/utils/contracts';
import Logger from '@/utils/logger';
import { type DistributionState } from './contract';
import type { PreviousDistribution } from '@/types/facilitator';

interface DistributionDetail {
  distributedTokens: BigNumber;
}

interface DistributionResult {
  details: {
    [fingerprint: string]: DistributionDetail;
  };
}

interface State {
  previousDistributions?: {
    [timestamp: string]: DistributionResult;
  };
}

// Type for tempMap
interface TempMap {
  [fingerprint: string]: BigNumber;
}

const state: State = {
  previousDistributions: {
    timestamp1: {
      details: {
        fingerprint1: { distributedTokens: new BigNumber(100) },
        fingerprint2: { distributedTokens: new BigNumber(200) },
      },
    },
    timestamp2: {
      details: {
        fingerprint1: { distributedTokens: new BigNumber(50) },
        fingerprint3: { distributedTokens: new BigNumber(300) },
      },
    },
  },
};

export class Distribution {
  private _refreshing: boolean = false;
  private contract: Contract<DistributionState> | null = null;
  private _isInitialized: boolean = false;
  private logger = new Logger('Distribution');

  get isInitialized() {
    return this._isInitialized;
  }

  initialize(contract: Contract<DistributionState>) {
    if (this._isInitialized) {
      return;
    }

    this.contract = contract;
    this._isInitialized = true;
    /* eslint-disable-next-line @typescript-eslint/no-floating-promises */
    this.refresh();
  }

  private setRefreshing(refreshing: boolean) {
    useFacilitatorStore().distributionRefreshing = refreshing;
    this._refreshing = refreshing;
  }

  async refresh(): Promise<void> {
    try {
      if (this._refreshing) {
        return;
      }

      this.setRefreshing(true);
      const auth = useUserStore();

      this.logger.info(
        auth.userData?.address
          ? `Distribution refreshing for ${auth.userData?.address}`
          : 'Distribution refreshing'
      );
      this.logger.time();

      let claimableAtomicTokens = null;
      if (auth.userData?.address) {
        claimableAtomicTokens = await this.claimable(
          auth.userData.address as string
        );
      }
      await this.getPreviousDistributions();
      const distributionRatePerDay = await this.getDistributionRatePer('day');
      this.logger.timeEnd();
      this.logger.info('Distribution refreshed', {
        claimableAtomicTokens,
        distributionRatePerDay: distributionRatePerDay.toString(),
      });
      this.setRefreshing(false);
    } catch (error) {
      this.logger.error('ERROR REFRESHING DISTRIBUTION', error);
    }
  }

  async getDistributionRatePer(period: 'second' | 'hour' | 'day' = 'day') {
    if (!this.contract) {
      throw new Error('Distribution Contract not initialized!');
    }

    const {
      cachedValue: { state },
    } = await this.contract.readState();

    const wholeTokensPerSecond = BigNumber(
      state.tokensDistributedPerSecond
    ).dividedBy(1e18);

    switch (period) {
      case 'second':
        return wholeTokensPerSecond;
      case 'hour':
        return wholeTokensPerSecond.times(24 * 60);
      case 'day':
        const rate = wholeTokensPerSecond.times(24 * 60 * 60);
        useFacilitatorStore().distributionRatePerDay = rate.toString();
        return rate;
    }
  }

  async getPreviousDistributions(): Promise<PreviousDistribution[]> {
    if (!this.contract) {
      throw new Error('Distribution Contract not initialized!');
    }

    const {
      cachedValue: { state },
    } = await this.contract.readState();

    let sumOfTotalDistributions = BigNumber(0);
    const previousDistributions = Object.keys(state.previousDistributions)
      .reverse()
      .map<PreviousDistribution>((timestamp) => {
        const {
          totalScore,
          totalDistributed,
          timeElapsed,
          tokensDistributedPerSecond,
        } = state.previousDistributions[timestamp];

        sumOfTotalDistributions =
          sumOfTotalDistributions.plus(totalDistributed);

        const date = new Date(Number.parseInt(timestamp));
        const formatDuration = (elapsed: string) => {
          const duration = moment.duration(elapsed);
          const d = duration.days();
          const h = duration.hours();
          const m = duration.minutes();
          const s = duration.seconds();
          const ms = duration.milliseconds();

          return `${d}.${h}:${m}:${s}.${ms}`;
        };
        return {
          timestamp,
          date,
          fromNowHumanized: moment(date).fromNow(),
          totalScore: BigNumber(totalScore).toFormat(),
          timeElapsed: formatDuration(timeElapsed),
          timeElapsedHumanized: moment.duration(timeElapsed).humanize(),
          totalDistributed: BigNumber(totalDistributed)
            .dividedBy(1e18)
            .toFormat(2),
          tokensDistributedPerDay: BigNumber(tokensDistributedPerSecond)
            .dividedBy(1e18)
            .times(24 * 60 * 60)
            .toFormat(2),
        };
      });

    useFacilitatorStore().sumOfTotalDistributions =
      sumOfTotalDistributions.toString();
    useFacilitatorStore().previousDistributions = previousDistributions;

    // Initialize tempMap
    let tempMap: TempMap = {};

    // Iterate through state and populate tempMap
    if (state?.previousDistributions) {
      for (const [timestamp, distributionResult] of Object.entries(
        state.previousDistributions
      )) {
        const distResult = distributionResult as DistributionResult;
        if (distResult?.details) {
          for (const [fingerprint, previousDistribution] of Object.entries(
            distResult.details
          )) {
            const distributionDetail =
              previousDistribution as DistributionDetail;

            if (!tempMap[fingerprint]) {
              tempMap[fingerprint] = BigNumber(
                distributionDetail.distributedTokens
              );
            } else {
              // add
              tempMap[fingerprint] = tempMap[fingerprint].plus(
                distributionDetail.distributedTokens
              );
            }
          }
        }
      }
    }

    for (const [fingerprint, totalDistributed] of Object.entries(tempMap)) {
      // change string to BigNumber

      const toBigNumber = BigNumber(totalDistributed);
      tempMap[fingerprint] = toBigNumber.dividedBy(1e18).decimalPlaces(2);
    }

    useFacilitatorStore().distributionPerRelay = tempMap;

    return previousDistributions;
  }

  async claimable(address: string, humanize = false) {
    if (!this.contract) {
      throw new Error('Distribution Contract not initialized!');
    }
    if (!address) {
      console.log('Address is required');
      return;
    }

    try {
      const { result: claimable } = await this.contract.viewState<
        Claimable,
        string
      >({
        function: 'claimable',
        address,
      });

      // Ensure that claimable is a valid number or convertable value
      const claimableValue = claimable ? claimable : '0';

      if (isNaN(claimableValue)) {
        this.logger.error(
          `Invalid claimable value received for ${address}:`,
          claimable
        );
        return humanize ? '0.0000' : '0';
      }

      const auth = useUserStore();
      if (auth.userData && address === auth.userData.address) {
        useFacilitatorStore().claimableAtomicTokens = claimableValue;
      }

      return humanize
        ? BigNumber(claimableValue).dividedBy(1e18).toFormat(4)
        : claimableValue;
    } catch (error) {
      this.logger.error(
        'Error in Distribution when checking claimable tokens for',
        address,
        error
      );
    }
  }
}

const distribution = new Distribution();
export const initDistribution = (): Promise<void> => {
  return new Promise((resolve) => {
    if (distribution.isInitialized) {
      // If already initialized, resolve immediately
      resolve();
      return;
    }

    const config = useRuntimeConfig();
    const warp = useWarp();
    const contract = warp.contract<DistributionState>(
      config.public.distributionContract as string
    );

    distribution.initialize(contract);
    resolve();
  });
};
export const useDistribution = () => distribution;
