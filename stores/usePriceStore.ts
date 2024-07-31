import { getAnonAddressMain } from '~/config/web3modal.config';
import Logger from '~/utils/logger';

const logger = new Logger('PriceStore');

const to = Math.floor(Date.now() / 1000);
const from = to - 3600 * 48; // 48 hrs
const apiEndpoint = `https://api.dex.guru/v1/tradingview/history?symbol=${getAnonAddressMain()}-eth_USD&resolution=240&from=${from}&to=${to}`; // TODO: Use In MainNet

export const usePriceStore = defineStore('price', {
  state: () => ({
    currentPrice: {
      data: 0,
    },
    priceHistory: {
      data: [] as number[],
    },
    status: '',
    fetchedAt: '' as string | Date,
    lastFetched: 0, // to store the timestamp of the last fetch
  }),

  actions: {
    async fetchPrice(forceRefresh = false) {
      const now = Date.now();
      const cacheTTL = 1000 * 60 * 5; // 5 minutes

      if (!forceRefresh && now - this.lastFetched < cacheTTL) {
        logger.info('Using cached price data');
        return;
      }

      try {
        const priceData: any = await $fetch(apiEndpoint);
        this.fetchedAt = new Date().toTimeString();
        this.currentPrice.data = priceData.c[priceData.c.length - 1] || 0;
        this.priceHistory.data = Object.values(priceData.c) || [];
        this.lastFetched = now;
      } catch (error) {
        logger.error('Price fetching error:', error);
      }
    },
  },
});
