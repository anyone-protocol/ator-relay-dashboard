import { useEventlogStore } from '@/stores/eventlog';

const logLevels: { [key: string]: number } = {
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export default class Logger {
  private level = logLevels[process.env.LOG_LEVEL || 'info'];

  constructor(private className: string) {}

  private get prepend() {
    return `[${this.className}]`;
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  log(...messages: any[]) {
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
    this.info(...messages);
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  info(...messages: any[]) {
    const prepend = `[INFO]${this.prepend}`;
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
    useEventlogStore().append(this.className, 'info', prepend, ...messages);

    if (this.level >= logLevels.info) {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      console.info(prepend, ...messages);
    }
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  error(...messages: any[]) {
    const prepend = `[ERROR]${this.prepend}`;
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
    useEventlogStore().append(this.className, 'error', prepend, ...messages);

    if (this.level >= logLevels.error) {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      console.error(prepend, ...messages);
    }
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  warn(...messages: any[]) {
    const prepend = `[WARN]${this.prepend}`;
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
    useEventlogStore().append(this.className, 'warn', prepend, ...messages);

    if (this.level >= logLevels.warn) {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      console.warn(prepend, ...messages);
    }
  }

  time() {
    console.time(`[TIME]${this.prepend}`);
  }

  timeEnd() {
    console.timeEnd(`[TIME]${this.prepend}`);
  }
}
