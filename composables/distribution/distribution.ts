import { type Contract } from 'warp-contracts';
import BigNumber from 'bignumber.js';
import moment from 'moment';

import { type Claimable } from '@/utils/contracts';
import Logger from '@/utils/logger';
import { type DistributionState } from './contract';
import type { PreviousDistribution } from '@/types/facilitator';
import { add } from 'lodash';
import { Facilitator } from '../facilitator';
const config = useRuntimeConfig();

interface DistributionDetail {
  distributedTokens: BigNumber;
  bonuses: {
    hardware: BigNumber;
    quality: BigNumber;
  };
  multipliers: {
    family: string;
    region: string;
  };
  score: BigNumber;
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

interface TempMapBonuses {
  [fingerprint: string]: {
    hardware: BigNumber;
    quality: BigNumber;
  };
}

interface TempMapMultipliers {
  [fingerprint: string]: {
    family: string;
    region: string;
  };
}

const state: State = {
  previousDistributions: {
    timestamp1: {
      details: {
        fingerprint1: {
          distributedTokens: new BigNumber(100),
          bonuses: { hardware: new BigNumber(0), quality: new BigNumber(0) },
          multipliers: { family: '1', region: '1' },
          score: new BigNumber(100),
        },
        fingerprint2: {
          distributedTokens: new BigNumber(0),
          bonuses: { hardware: new BigNumber(0), quality: new BigNumber(0) },
          multipliers: { family: '1', region: '1' },
          score: new BigNumber(0),
        },
      },
    },
    timestamp2: {
      details: {
        fingerprint1: {
          distributedTokens: new BigNumber(100),
          bonuses: { hardware: new BigNumber(0), quality: new BigNumber(0) },
          multipliers: { family: '1', region: '1' },
          score: new BigNumber(100),
        },
        fingerprint2: {
          distributedTokens: new BigNumber(50),
          bonuses: { hardware: new BigNumber(0), quality: new BigNumber(0) },
          multipliers: { family: '1', region: '1' },
          score: new BigNumber(50),
        },
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
            // console.log('state', state);

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

    let sumOfTotalDistributions = BigNumber(0);
    console.log('state:', state);

    // Get the latest timestamp entry
    const latestTimestamp = Object.keys(state.previousDistributions)
      .map(Number)
      .sort((a, b) => b - a)[0]; // Sort in descending order and take the first (latest) timestamp

    const distResult = state.previousDistributions[latestTimestamp];
    if (!distResult) {
      throw new Error('No distributions found');
    }

    const {
      totalScore,
      totalDistributed,
      timeElapsed,
      tokensDistributedPerSecond,
    } = distResult;

    sumOfTotalDistributions = sumOfTotalDistributions.plus(totalDistributed);

    const date = new Date(latestTimestamp);
    const formatDuration = (elapsed: string) => {
      const duration = moment.duration(elapsed);
      const d = duration.days();
      const h = duration.hours();
      const m = duration.minutes();
      const s = duration.seconds();
      const ms = duration.milliseconds();

      return `${d}.${h}:${m}:${s}.${ms}`;
    };

    const previousDistributions = [
      {
        timestamp: latestTimestamp.toString(),
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
      },
    ];

    useFacilitatorStore().sumOfTotalDistributions =
      sumOfTotalDistributions.toString();
    useFacilitatorStore().previousDistributions = previousDistributions;

    // Initialize tempMap
    let distributionMap: TempMap = {};
    let hardwareBonusesMap: TempMapBonuses = {};
    let familyMultipliersMap: TempMapMultipliers = {};
    let scoreMap: TempMap = {};
    let lastDistributionTimePerRelay: Record<string, string | null> = {};
    let baseTokensMap: Record<string, BigNumber> = {};

    // Iterate over details in the latest distribution timestamp
    if (distResult?.details) {
      for (const [fingerprint, previousDistribution] of Object.entries(
        distResult.details
      )) {
        const distributionDetail = previousDistribution as DistributionDetail;

        // Handle distribution map
        distributionMap[fingerprint] = BigNumber(
          distributionDetail.distributedTokens
        )
          .dividedBy(1e18)
          .decimalPlaces(3);

        // Handle hardware and quality bonuses
        hardwareBonusesMap[fingerprint] = {
          hardware: BigNumber(distributionDetail.bonuses?.hardware || 0)
            .dividedBy(1e18)
            .decimalPlaces(3),
          quality: BigNumber(distributionDetail.bonuses?.quality || 0)
            .dividedBy(1e18)
            .decimalPlaces(3),
        };

        // Handle family and region multipliers (stored as strings)
        familyMultipliersMap[fingerprint] = {
          family: distributionDetail.multipliers?.family || '1',
          region: distributionDetail.multipliers?.region || '1',
        };

        // Handle score map
        scoreMap[fingerprint] = BigNumber(distributionDetail.score);

        // Update last distribution time per relay
        lastDistributionTimePerRelay[fingerprint] = new Date(
          latestTimestamp
        ).toLocaleString();

        // Calculate base tokens
        const baseTokens = BigNumber(distributionDetail.distributedTokens)
          .dividedBy(1e18)
          .minus(hardwareBonusesMap[fingerprint].hardware)
          .minus(hardwareBonusesMap[fingerprint].quality)
          .decimalPlaces(3);
        baseTokensMap[fingerprint] = baseTokens;
      }
    }

    useFacilitatorStore().distributionPerRelay = distributionMap;
    useFacilitatorStore().bonusesPerRelay = hardwareBonusesMap;
    useFacilitatorStore().multipliersPerRelay = familyMultipliersMap;
    useFacilitatorStore().scorePerRelay = scoreMap;
    useFacilitatorStore().baseTokensPerRelay = baseTokensMap;
    useFacilitatorStore().lastDistributionTimePerRelay =
      lastDistributionTimePerRelay;

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

  async airdropTokens(address: string, humanize = false): Promise<string> {
    if (!address) {
      console.log('Address is required');
      return Promise.resolve('0');
    }

    const AIRDROP_API_URL = config.public.airdropApi as string;
    const VARIATION_API_URL = config.public.variationApi as string;
    try {
      const response = await fetch(AIRDROP_API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch airdrop data');
      }

      const airdropData = await response.json();
      console.log('airdropData:', airdropData);

      const userAirdrop = airdropData.find(
        (entry: { id: string; airdrop: number }) =>
          entry.id.toLowerCase() === address.toLowerCase()
      );

      const variationResponse = await fetch(VARIATION_API_URL);
      if (!variationResponse.ok) {
        throw new Error('Failed to fetch variation data');
      }

      const variationData = await variationResponse.json();
      const variation = variationData.filter(
        (entry: { id: string; variation: number }) =>
          entry.id.toLowerCase() === address.toLowerCase()
      );
      // console.log('variationResult:', variation);

      if (!userAirdrop && !variation) {
        console.log('No airdrop found for this address');
        return '0';
      }
      console.log('userAirdrop:', userAirdrop);

      const airDropValue = userAirdrop?.airdrop ?? '0';
      // console.log('airDropValue:', airDropValue);
      // console.log('variation:', variation[0].variation);
      const variationValue = BigNumber(variation[0]?.variation ?? 0);
      console.log('variationValue:', variationValue.toString());

      const result = BigNumber(airDropValue).minus(variationValue).toString();

      console.log('airDropResult:', result);

      useFacilitatorStore().airDropTokens = result;

      return Promise.resolve(result);
    } catch (error) {
      console.error('Error fetching airdrop data:', error);
      return Promise.resolve('0');
    }
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
