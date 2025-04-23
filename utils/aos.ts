import {
  message as ao2Message,
  result as ao2Result,
  dryrun as ao2DryRun,
  createDataItemSigner,
} from '@permaweb/aoconnect';

const {
  public: { aoCuUrl: PRIMARY_CU_URL, aoCuUrlFallback: FALLBACK_CU_URL },
} = useRuntimeConfig();

const CU_URLS = [PRIMARY_CU_URL, FALLBACK_CU_URL].filter(
  (url): url is string => typeof url === 'string' && url.length > 0
);

if (CU_URLS.length === 0) {
  console.error('No AO Compute Unit URLs configured!');
}

export type MessageResult = {
  Output: any;
  Messages: any[];
  Spawns: any[];
  Error?: any;
};

export type AosActionResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

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

// Helper function to check if an error is likely a connection/server error
function isRetryableError(error: any): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('500') ||
      error.message.includes('502') ||
      error.message.includes('503') ||
      error.message.includes('504') ||
      error.message.includes('fetch failed') ||
      error.message.includes('NetworkError') ||
      error.message.includes('timeout') ||
      error.message.includes('202')
    );
  }
  return false;
}

export async function sendAosDryRun(
  { processId, data, tags }: SendAosDryRunOptions,
  retries = 3
) {
  let attempts = 0;
  let lastError: Error | undefined;

  while (attempts < retries) {
    for (const cuUrl of CU_URLS) {
      try {
        console.debug(
          `Attempt ${attempts + 1}/${retries}: Sending AO DryRun to process ${processId} via ${cuUrl}`
        );

        const result = await ao2DryRun({
          process: processId,
          tags,
          data,
          CU_URL: cuUrl,
        });

        console.debug(
          `Success: AO DryRun for process ${processId} via ${cuUrl}`
        );
        return { result };
      } catch (error: any) {
        lastError = error;
        console.error(
          `Attempt ${attempts + 1}/${retries}: Error sending AO DryRun to process ${processId} via ${cuUrl}`,
          error.message || error
        );

        if (!isRetryableError(error) || cuUrl === CU_URLS[CU_URLS.length - 1]) {
          break;
        }
        console.debug(`Trying next CU URL for process ${processId}...`);
      }
    }

    attempts++;
    if (attempts < retries) {
      const delay = 2 ** attempts * 1000;
      console.debug(
        `All CU URLs failed for attempt ${attempts}. Retrying in ${delay / 1000}s...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error(
    `AO DryRun failed after ${retries} attempts for process ${processId}. Last error:`,
    lastError?.message || lastError
  );
  throw lastError;
}

export async function sendAosMessage(
  { processId, data, tags, signer }: SendAosMessageOptions,
  retries = 3
) {
  let attempts = 0;
  let lastError: Error | undefined;

  while (attempts < retries) {
    let messageId: string | undefined;
    for (const cuUrl of CU_URLS) {
      try {
        console.debug(
          `Attempt ${attempts + 1}/${retries}: Sending AO Message to process ${processId} via ${cuUrl}`
        );

        messageId = await ao2Message({
          process: processId,
          tags,
          data,
          signer,
          CU_URL: cuUrl,
        });

        console.debug(
          `Attempt ${attempts + 1}/${retries}: Fetching AO Message result ${messageId} from process ${processId} via ${cuUrl}`
        );

        const result = await ao2Result({
          message: messageId,
          process: processId,
          CU_URL: cuUrl,
        });

        console.debug(
          `Success: Got AO Message result ${messageId} from process ${processId} via ${cuUrl}`
        );
        return { messageId, result };
      } catch (error: any) {
        lastError = error;
        console.error(
          `Attempt ${attempts + 1}/${retries}: Error during AO Message/Result for process ${processId} via ${cuUrl} (MessageID: ${messageId ?? 'N/A'})`,
          error.message || error
        );

        if (!isRetryableError(error) || cuUrl === CU_URLS[CU_URLS.length - 1]) {
          break;
        }
        console.debug(`Trying next CU URL for process ${processId}...`);
        messageId = undefined;
      }
    }

    attempts++;
    if (attempts < retries) {
      const delay = 2 ** attempts * 1000;
      console.debug(
        `All CU URLs failed for attempt ${attempts}. Retrying in ${delay / 1000}s...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error(
    `AO Message/Result failed after ${retries} attempts for process ${processId}. Last error:`,
    lastError?.message || lastError
  );
  throw lastError;
}
