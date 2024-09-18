import { defineStore } from 'pinia';

import { type LogLevel } from '@/utils/logger';

export type LogMessage = {
  level: LogLevel;
  timestamp: number;
  source: string;
  message: string;
};

export type SupportIssue = {
  address: string;
  logs: LogMessage[];
  host: string;
  path: string;
  phase: string;
};

interface EventlogStoreState {
  logs: LogMessage[];
  filters: {
    error: boolean;
    warn: boolean;
    info: boolean;
    debug: boolean;
  };
  isReportIssueOpen: boolean;
}

function replacer(key: string, value: any) {
  return typeof value === 'bigint' ? value.toString() : value;
}

export const useEventlogStore = defineStore('eventlog', {
  state: (): EventlogStoreState => {
    return {
      logs: [],
      filters: {
        error: true,
        warn: true,
        info: true,
        debug: false,
      },
      isReportIssueOpen: false,
    };
  },
  getters: {
    filtered: (state) => state.logs.filter((log) => state.filters[log.level]),
  },
  actions: {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    append(source: string, level: LogLevel, ...messages: any[]) {
      const timestamp = Date.now();
      const message = messages.reduce<string>((rest, c) => {
        /* eslint-disable @typescript-eslint/no-unsafe-argument */
        /* eslint-disable @typescript-eslint/no-unsafe-assignment */
        /* eslint-disable @typescript-eslint/no-unsafe-call */
        /* eslint-disable @typescript-eslint/no-unsafe-member-access */
        const currentPart =
          c instanceof Error
            ? c.stack || c.message
            : typeof c === 'object'
              ? JSON.stringify(c, replacer) // Use replacer here
              : `${c}`;
        /* eslint-enable @typescript-eslint/no-unsafe-argument */
        /* eslint-enable @typescript-eslint/no-unsafe-assignment */
        /* eslint-enable @typescript-eslint/no-unsafe-call */
        /* eslint-enable @typescript-eslint/no-unsafe-member-access */

        return rest + ' ' + currentPart;
      }, '');
      this.logs.push({ source, level, message, timestamp });
    },
  },
});
