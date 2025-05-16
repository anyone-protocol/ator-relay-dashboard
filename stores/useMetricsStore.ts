import { defineStore } from 'pinia';

import Logger from '@/utils/logger';
import { parseTimestampTag } from '@/utils/transactions';
import { useTxCache } from '@/composables/txCache';

const config = useRuntimeConfig();

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
  anon_address: string;
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
  latestHeight: number | null;
  minimumHeight: number | null;
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
      latestHeight: null,
      minimumHeight: null,
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
      this.refreshRelayMetrics();
      logger.timeEnd();
      logger.log('Metrics finished refreshing');
      this._refresh.last = Date.now();
      this.relayMetricsPending = false;
    },
    async centralizedRelayMetrics() {
      return new Promise(async (resolve, reject) => {
        const cachedData = useRelayCache();
        cachedData.getRelayData().then(async (data) => {
          if (!data) {
            reject('No relays found to check meta');
            return;
          }
          const userStore = useUserStore();
          const allFingerprints = [] as string[];

          console.log('relay data', data);

          data.verified.forEach((relay: any) => {
            const exists = userStore.relaysMeta[relay.fingerprint];
            if (!exists) {
              allFingerprints.push(relay);
            }
          });

          data.claimable.forEach((relay: any) => {
            const exists = userStore.relaysMeta[relay.fingerprint];
            if (!exists) {
              allFingerprints.push(relay);
            }
          });

          if (allFingerprints.length === 0) {
            resolve(data);
            return;
          }

          console.log('allFingerprints', allFingerprints);

          try {
            const endpoint =
              config.public.centralizedMetricsAPI +
              '/relays?fingerprints=' +
              allFingerprints.join(',');

            console.log('endpoint', endpoint);
            const response = await fetch(endpoint);

            if (response.status === 404 || response.status === 204) {
              resolve([]);
              return;
            }
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data === 'No relays found') {
              resolve([]);
              return;
            }

            console.log('data', data);

            data.forEach((metric: any) => {
              const exists = userStore.relaysMeta[metric.fingerprint];
              userStore.relaysMeta[metric.fingerprint] = {
                fingerprint: metric.fingerprint,
                nickname: metric.nickname,
                status: '',
                anon_address: '',
                consensus_weight: metric.consensus_weight.toString(),
                observed_bandwidth: metric.observed_bandwidth,
                consensus_weight_fraction: 0,
                running: metric.running,
              };
            });
            resolve(data);
          } catch (error: any) {
            // Reject the promise in case of an error
            logger.error(
              `Error fetching centralized relay metrics: ${error.message}`
            );
            reject();
          }
        });
      });
    },
    async refreshRelayMetrics(limit: number = 1) {
      this.relayMetricsPending = true;
      const startTime = performance.now();
      await this.centralizedRelayMetrics();
      const endTime = performance.now();
      logger.info(
        `Centralized relay metrics refreshed in ${(endTime - startTime).toFixed(
          2
        )} ms`
      );
      this.relayMetricsPending = false;
    },
  },
});
