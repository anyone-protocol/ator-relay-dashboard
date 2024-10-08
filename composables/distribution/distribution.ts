import { type Contract } from 'warp-contracts';
import BigNumber from 'bignumber.js';
import moment from 'moment';

import { type Claimable } from '@/utils/contracts';
import Logger from '@/utils/logger';
import { type DistributionState } from './contract';
import type { PreviousDistribution } from '@/types/facilitator';
import { add } from 'lodash';
const config = useRuntimeConfig();

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
  private warpWorker: Worker | null = null;
  private readState: any = null;

  get isInitialized() {
    return this._isInitialized;
  }

  initialize(contract: Contract<DistributionState>) {
    if (this._isInitialized) {
      return;
    }

    this.contract = contract;
    this.warpWorker = new Worker(
      new URL('@/static/warpWoker-DreNode.js', import.meta.url),
      {
        type: 'module',
      }
    );
    this.warpWorker.onmessage = (event) => {
      const { task } = event.data;
      if (task === 'workerReady') {
        this._isInitialized = true;
        /* eslint-disable-next-line @typescript-eslint/no-floating-promises */
        this.refresh();
      }
    };
  }

  private setRefreshing(refreshing: boolean) {
    useFacilitatorStore().distributionRefreshing = refreshing;
    this._refreshing = refreshing;
  }

  async refresh(): Promise<void> {
    if (!this._isInitialized) {
      this.logger.error('Worker is not initialized');
      return;
    }
    if (this._refreshing) {
      return;
    }

    try {
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
          auth.userData.address as string,
          true
        );
      }
      await this.getReadState();
      await this.getPreviousDistributions();
      const distributionRatePerDay = await this.getDistributionRatePer('day');
      this.logger.timeEnd();
      this.logger.info('Distribution refreshed', {
        claimableAtomicTokens,
        distributionRatePerDay: distributionRatePerDay.toString(),
      });
    } catch (error) {
      this.logger.error('ERROR REFRESHING DISTRIBUTION', error);
    } finally {
      this.setRefreshing(false);
    }
  }

  async getReadState(retries = 3, delay = 1000): Promise<void> {
    if (!this.warpWorker) {
      throw new Error('Distribution Contract not initialized!');
    }

    return new Promise((resolve, reject) => {
      const attemptReadState = (attemptsLeft: number) => {
        if (attemptsLeft <= 0) {
          this.logger.error('Max retries reached. Failed to fetch state.');
          return reject(
            new Error('Max retries reached. Failed to fetch state.')
          );
        }

        this.warpWorker!.postMessage({
          task: 'readState',
          payload: {
            contractId: config.public.distributionContract as string,
            contractName: 'distribution',
          },
        });

        const handleMessage = (e: MessageEvent) => {
          const { task, contractName, result, error } = e.data;
          if (task === 'readState' && contractName === 'distribution') {
            this.warpWorker!.removeEventListener('message', handleMessage); // Remove listener after it's done

            if (error) {
              this.logger.error('Error reading state from worker:', error);
              return reject(error);
            }

            const state = result?.cachedValue?.state;
            console.log('state', state);

            if (!state) {
              this.logger.warn(
                `Empty state received. Retrying... (${retries - attemptsLeft + 1}/${retries})`
              );
              setTimeout(() => attemptReadState(attemptsLeft - 1), delay);
            } else {
              this.readState = state;
              resolve();
            }
          }
        };

        this.warpWorker!.addEventListener('message', handleMessage);
      };

      attemptReadState(retries);
    });
  }

  async getDistributionRatePer(period: 'second' | 'hour' | 'day' = 'day') {
    if (!this.readState) {
      await this.getReadState();
    }

    const state = this.readState;
    if (!state) {
      throw new Error('Invalid state from distribution contract');
    }

    const wholeTokensPerSecond = new BigNumber(
      state.tokensDistributedPerSecond
    ).dividedBy(1e18);

    switch (period) {
      case 'second':
        return wholeTokensPerSecond;
      case 'hour':
        return wholeTokensPerSecond.times(60 * 60);
      case 'day':
        const rate = wholeTokensPerSecond.times(24 * 60 * 60);
        useFacilitatorStore().distributionRatePerDay = rate.toString();
        return rate;
    }
  }

  async getPreviousDistributions(): Promise<PreviousDistribution[]> {
    if (!this.readState) {
      await this.getReadState();
    }

    const state = this.readState;
    if (!state) {
      throw new Error('Invalid state from distribution contract');
    }
    // const {
    //   cachedValue: { state },
    // } = await this.contract.readState();

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

  async claimable(
    address: string,
    humanize = false
  ): Promise<string | undefined> {
    if (!address) {
      console.log('Address is required');
      return;
    }

    return new Promise((resolve, reject) => {
      if (!this.warpWorker) {
        throw new Error('Warp Contract not initialized!');
      }
      this.warpWorker.postMessage({
        task: 'claimable',
        payload: {
          contractId: config.public.distributionContract as string,
          contractName: 'distribution',
          address,
        },
      });

      const handleMessage = (e: MessageEvent) => {
        const { task, result: claimable, error } = e.data;

        if (task === 'claimable') {
          this.warpWorker!.removeEventListener('message', handleMessage); // Remove listener after it's done

          if (error) {
            this.logger.error(
              'Error in Distribution when checking claimable tokens for',
              address,
              error
            );
            resolve('0');
          }

          let claimableValue = claimable ? claimable : '0';
          console.log('claimableValue:', claimableValue);

          // Update store if it's the authenticated user's address
          const auth = useUserStore();
          if (auth.userData && address === auth.userData.address) {
            useFacilitatorStore().claimableAtomicTokens = claimableValue;
          }

          const result = humanize
            ? BigNumber(claimableValue).dividedBy(1e18).toFormat(4)
            : claimableValue;
          console.log('claimableResult:', result);

          resolve(result);
        }
      };

      // Attach the event listener for the 'claimable' task
      this.warpWorker!.addEventListener('message', handleMessage);
    });
  }
}

const distribution = new Distribution();
export const initDistribution = () => {
  if (distribution.isInitialized) {
    return;
  }

  const warp = useWarp();
  const contract = warp.contract<DistributionState>(
    config.public.distributionContract as string
  );
  contract.setEvaluationOptions({ remoteStateSyncEnabled: true });

  distribution.initialize(contract);
};
export const useDistribution = () => distribution;
