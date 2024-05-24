import { defineStore } from 'pinia';

import ArDB from 'ardb';
import Arweave from 'arweave';

export const useMetricsStore = defineStore('relayMetrics', {
  state: () => ({
    transactionId: 'bKdUd6vonjrZS4-FUGMPr5ecOeF405pR2DdO_at1D9I',
  }),
  actions: {
    async getArweaveTransactions() {
      const arweave = Arweave.init({});
      const ardb = new ArDB(arweave);
      const {
        public: { validatorContract },
      } = useRuntimeConfig();

      // Get the latest relay metrics transaction
      try {
        const latestTransaction = await ardb
          .sort('HEIGHT_DESC')
          .search('transactions')
          .from(validatorContract)
          .tags([
            { name: 'Protocol', values: 'ator' },
            { name: 'Protocol-Version', values: '0.1' },
            { name: 'Entity-Type', values: 'relay/metrics' },
            { name: 'Content-Type', values: 'application/json' },
          ])
          .findOne();

        if (!latestTransaction) {
          console.error('No relay metrics transaction found');
          return;
        }
        this.transactionId = latestTransaction.id;
      } catch (error) {
        console.error('Error querying relay/metrics', error);
      }
    },
  },
});
