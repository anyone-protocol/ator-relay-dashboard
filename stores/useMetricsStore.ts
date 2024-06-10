import { defineStore } from 'pinia';
import ArdbTransaction from 'ardb/lib/models/transaction';

import Logger from '@/utils/logger';
import { parseTimestampTag } from '@/utils/transactions';
import { useArdb } from '@/composables/ardb';
import { useTxCache } from '@/composables/txCache';

export interface ValidationStats {
  consensus_weight: number;
  consensus_weight_fraction: number;
  observed_bandwidth: number;
  verification: {
    failed: number;
    running: number;
    unclaimed: number;
    verified: number;
  };
  verified_and_running: {
    consensus_weight: number;
    consensus_weight_fraction: number;
    observed_bandwidth: number;
  };
}

export type RelayVerificationResult =
  | 'OK'
  | 'AlreadyVerified'
  | 'NotRegistered'
  | 'Failed';

export interface ValidatedRelay {
  fingerprint: string;
  ator_address: string;
  consensus_weight: number;
  consensus_weight_fraction: number;
  observed_bandwidth: number;
  running: boolean;
  nickname: string;
}

export interface VerificationResultDto {
  result: RelayVerificationResult;
  relay: ValidatedRelay;
}

export interface HumanizedValidatedRelay
  extends Omit<ValidatedRelay, 'consensus_weight' | 'observed_bandwidth'> {
  consensus_weight: string;
  observed_bandwidth: string;
}

export interface MetricsStoreState {
  _refresh: {
    last?: number;
    interval: number;
  };
  validation: {
    latest: ValidationStats | null;
    timestamp?: number;
    transactionIds: string[];
  };
  relays: {
    latest: VerificationResultDto[] | null;
    timestamp?: number;
    transactionIds: string[];
  };
  relayMetricsPending: boolean;
}

const logger = new Logger('MetricsStore');

export const useMetricsStore = defineStore('metrics', {
  state: (): MetricsStoreState => {
    return {
      _refresh: {
        interval: 60 * 1000, // NB: Only allow refresh once per minute
      },
      validation: {
        latest: null,
        transactionIds: [],
      },
      relays: {
        latest: null,
        transactionIds: [],
      },
      relayMetricsPending: true,
    };
  },
  getters: {},
  actions: {
    async refresh() {
      const shouldRefresh =
        !this._refresh.last ||
        Date.now() - this._refresh.last >= this._refresh.interval;

      if (!shouldRefresh) {
        logger.info('Metrics did not refresh', this._refresh.last);
        return;
      }

      this.relayMetricsPending = true;

      logger.info('Metrics start refreshing');
      logger.time();
      await this.refreshValidationStats();
      await this.refreshRelayMetrics();
      logger.timeEnd();
      logger.log('Metrics finished refreshing');
      this._refresh.last = Date.now();

      this.relayMetricsPending = false;
    },

    async refreshRelayMetrics(limit: number = 5) {
      const ardb = useArdb();
      const runtimeConfig = useRuntimeConfig();

      const txCache = useTxCache();

      try {
        const txs = (await ardb
          .search('transactions')
          .from(runtimeConfig.public.metricsDeployer as string)
          .tags([
            { name: 'Protocol', values: 'ator' },
            { name: 'Entity-Type', values: 'relay/metrics' },
          ])
          .limit(limit)
          .sort('HEIGHT_DESC')
          .find()) as ArdbTransaction[];

        logger.info(`Got ${txs.length} relay/metrics transactions`);

        const latestTx = txs[0];

        if (latestTx) {
          const latestRelayMetrics = await txCache.getTransactionData<
            VerificationResultDto[]
          >(latestTx.id);

          if (latestRelayMetrics) {
            logger.info('Got latest relay/metrics', latestRelayMetrics.length);
            this.relays.latest = latestRelayMetrics;

            const timestamp = parseTimestampTag(latestTx);
            if (timestamp) {
              this.relays.timestamp = timestamp;
            }
          }
        }
      } catch (error) {
        logger.error('Error querying relay/metrics', error);
      }
    },

    async refreshValidationStats(limit: number = 5) {
      const ardb = useArdb();
      const runtimeConfig = useRuntimeConfig();

      const txCache = useTxCache();

      try {
        const txs = (await ardb
          .search('transactions')
          .from(runtimeConfig.public.metricsDeployer as string)
          .tags([
            { name: 'Protocol', values: 'ator' },
            { name: 'Entity-Type', values: 'validation/stats' },
          ])
          .limit(limit)
          .sort('HEIGHT_DESC')
          .find()) as ArdbTransaction[];

        logger.info(`Got ${txs.length} validation/stats transactions`);

        const latestTx = txs[0];

        if (latestTx) {
          const latestValidationStats =
            await txCache.getTransactionData<ValidationStats>(latestTx.id);

          if (latestValidationStats) {
            logger.info('Got latest validation/stats', latestValidationStats);
            this.validation.latest = latestValidationStats;

            const timestamp = parseTimestampTag(latestTx);
            if (timestamp) {
              this.validation.timestamp = timestamp;
            }
          }
        }

        this.validation.transactionIds = txs.map((tx) => tx.id);
      } catch (error) {
        logger.error('Error querying validation/stats', error);
      }
    },
  },
});
