import { relayRegistryContract } from '@/config/warp.config';
import { responseOutput } from '@/utils/responseOutput';

export type FunctionName = 'claim' | 'renounce' | 'register';

/**
 * NOTE: The fingerprints are an array here, not sure if that's accurate
 * That way a user can claim multiple relays at once
 */
export const warpWrite = async (
  fingerprint: string[],
  functionName: FunctionName
) => {
  if (!fingerprint)
    return responseOutput({
      status: 400,
      message: 'No fingerprint provided',
    });

  try {
    const { result, type, errorMessage } =
      await relayRegistryContract.viewState({
        function: functionName,
        fingerprint,
      });

    if (type === 'error' || type === 'exception')
      return responseOutput({
        status: 400,
        message: `Error. ${errorMessage}`,
      });

    return responseOutput({
      data: result,
      message: 'Success.',
      status: 200,
    });
  } catch (error) {
    return responseOutput({
      data: error,
      status: 500,
      message: 'Error',
    });
  }
};
