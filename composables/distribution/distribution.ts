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
  private _isInitialized: boolean = false;
  private logger = new Logger('Distribution');

  get isInitialized() {
    return this._isInitialized;
  }

  initialize() {
    if (this._isInitialized) {
      return;
    }

    // empty for now
  }

  private setRefreshing(refreshing: boolean) {
    useHolderStore().distributionRefreshing = refreshing;
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
    } catch (error) {
      this.logger.error('ERROR REFRESHING DISTRIBUTION', error);
    } finally {
      this.setRefreshing(false);
    }
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

      useHolderStore().airDropTokens = result;

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

  distribution.initialize();
};
export const useDistribution = () => distribution;
