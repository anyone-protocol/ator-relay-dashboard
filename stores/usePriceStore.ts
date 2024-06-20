import { getAtorAddressMain } from '~/config/web3modal.config';
import Logger from '~/utils/logger';

const to = Math.floor(Date.now() / 1000);
const from = to - 3600 * 48; // 48 hrs
const apiEndpoint = `https://api.dex.guru/v1/tradingview/history?symbol=${getAtorAddressMain()}-eth_USD&resolution=240&from=${from}&to=${to}`; // TODO Use In MainNet

const logger = new Logger('PriceStore');

export const usePriceStore = defineStore('price', {
  state: () => {
    return {
      currentPrice: {
        data: 0,
      },
      priceHistory: {
        data: [] as number[],
      },
      status: '',
      fetchedAt: '' as string | Date,
    };
  },

  actions: {
    async fetchPrice() {
      try {
        const priceData: any = await $fetch(apiEndpoint);
        this.fetchedAt = new Date().toTimeString();
        // Set current price
        this.currentPrice.data = priceData.c[priceData.c.length - 1] as
          | number
          | 0;
        // Set price history
        this.priceHistory.data = Object.values(priceData.c) as number[] | [];
      } catch (error) {
        logger.error('Price fetching error:', error);
      }
    },
  },
});
