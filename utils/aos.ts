import {
  message as aoMessage,
  result as aoResult,
  dryrun as aoDryRun,
  createDataItemSigner,
} from '@permaweb/aoconnect';

export type SendAosBaseOptions = {
  processId: string;
  data?: string;
  tags?: { name: string; value: string }[];
};
export type SendAosDryRunOptions = SendAosBaseOptions;
export type SendAosMessageOptions = SendAosBaseOptions & {
  signer: ReturnType<typeof createDataItemSigner>;
};

export type AosSigningFunction = ({
  data,
  tags,
  target,
  anchor,
}: {
  data: string | Uint8Array;
  tags: any[];
  target?: string;
  anchor?: string;
}) => Promise<{
  id: string;
  raw: Buffer;
}>;

export async function sendAosDryRun(
  { processId, data, tags }: SendAosDryRunOptions,
  retries = 3
) {
  let attempts = 0;
  let lastError: Error | undefined;

  while (attempts < retries) {
    try {
      console.debug(`Sending AO DryRun to process ${processId}`);

      return {
        result: await aoDryRun({
          process: processId,
          tags,
          data,
        }),
      };
    } catch (error: any) {
      console.error(`Error sending AO DryRun to process ${processId}`, error);

      if (error.message.includes('500')) {
        console.debug(
          `Retrying sending AO DryRun to process ${processId}`,
          JSON.stringify(
            { attempts, retries, error: error.message },
            undefined,
            2
          )
        );

        // NB: Sleep between each attempt with exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, 2 ** attempts * 2000)
        );

        attempts++;
        lastError = error;
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}

export async function sendAosMessage(
  { processId, data, tags, signer }: SendAosMessageOptions,
  retries = 3
) {
  let attempts = 0;
  let lastError: Error | undefined;

  while (attempts < retries) {
    try {
      console.debug(`Sending AO Message to process ${processId}`);

      const messageId = await aoMessage({
        process: processId,
        tags,
        data,
        signer,
      });

      console.debug(
        `Fetching AO Message result ${messageId} from process ${processId}`
      );
      const result = await aoResult({
        message: messageId,
        process: processId,
      });
      console.debug(
        `Got AO Message result ${messageId} from process ${processId}`
      );

      return { messageId, result };
    } catch (error: any) {
      console.error(`Error sending AO Message to process ${processId}`, error);

      if (error.message.includes('500')) {
        console.debug(
          `Retrying sending AO Message to process ${processId}`,
          JSON.stringify(
            { attempts, retries, error: error.message },
            undefined,
            2
          )
        );

        // NB: Sleep between each attempt with exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, 2 ** attempts * 2000)
        );

        attempts++;
        lastError = error;
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}
