import { isAddress } from 'viem';
import { relayRegistryContract } from '@/config/warp.config';
import { responseOutput } from '@/utils/responseOutput';

type FunctionName = 'verified' | 'claimable' | 'serials';

type RelayData = {
  timestamp: number;
  data: {
    verified: [
      {
        address: string;
        fingerprint: string;
        status: string;
        active: boolean;
        class: string;
      },
    ];
    claimable: [
      {
        address: string;
        fingerprint: string;
        status: string;
        active: boolean;
        class: string;
      },
    ];
    nicknames: { [key: string]: string };
    registrationCredits: string[];
  };
};

var test = '0xECc33A2782041fC5D032B214a22a596e1BC6a35b';

// getting the relays, either claimed or verified, by using corresponding function name and user's EVM address.
export const warpRead = async (
  address: `0x${string}`,
  functionName: FunctionName
) => {
  return new Promise(async (resolve, reject) => {
    if (!address)
      resolve(
        responseOutput({
          status: 400,
          message: 'No address provided',
        })
      );

    if (!isAddress(address))
      resolve(
        responseOutput({
          status: 400,
          message: 'Invalid address provided',
        })
      );

    try {
      const { result } = await relayRegistryContract.viewState({
        function: functionName,
        address: address,
      });

      const relays = result.map((relay: string) => {
        return {
          fingerprint: relay,
          status: functionName,
          active: true,
          class: '',
        };
      });

      const count = relays.length;
      const message =
        count === 0
          ? `No ${functionName} relays found`
          : `Success. All ${functionName} relays fetched.`;

      resolve(
        responseOutput({
          data: {
            count,
            relays: relays,
          },
          message,
          status: 200,
        })
      );
    } catch (error) {
      resolve(
        responseOutput({
          data: error,
          status: 500,
          message: 'Error',
        })
      );
    }
  });
};

export const readNickNames = async (): Promise<Record<
  string,
  string
> | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await relayRegistryContract.readState();

      resolve(result?.cachedValue?.state?.nicknames);
    } catch (error) {
      resolve(null);
    }
  });
};

export const warpReadSerials = async (
  address: `0x${string}`
): Promise<string[]> => {
  if (!address) {
    responseOutput({
      status: 400,
      message: 'No address provided',
    });
    return [];
  }

  if (!isAddress(address)) {
    responseOutput({
      status: 400,
      message: 'Invalid address provided',
    });
    return [];
  }

  try {
    const { state } = await relayRegistryContract.viewState({
      data: { address: address },
    });

    // Construct the response

    const serials = Object.keys(
      (state as { serials: Record<string, object> })?.serials || {}
    );

    return serials;
  } catch (error) {
    responseOutput({
      data: error,
      status: 500,
      message: 'Error',
    });
    return [];
  }
};

export const getAllRelays = async (
  address: `0x${string}`
): Promise<RelayData | undefined> => {
  try {
    const result = await relayRegistryContract.readState();
    if (!result?.cachedValue?.state) {
      throw new Error('Invalid state from relayRegistryContract');
    }

    const verifiedRelays = [];
    const claimableRelays = [];
    const registrationCredits = [];
    const nicknames: { [key: string]: any } = {};

    for (const [fingerprint, addressRelay] of Object.entries(
      result.cachedValue.state.claimable
    )) {
      if (address === addressRelay) {
        claimableRelays.push({
          address: address,
          fingerprint: fingerprint,
          status: 'claimable',
          active: true,
          class: '',
        });
      }
    }

    for (const [fingerprint, addressRelay] of Object.entries(
      result.cachedValue.state.verified
    )) {
      if (address === addressRelay) {
        verifiedRelays.push({
          address: address,
          fingerprint: fingerprint,
          status: 'verified',
          active: true,
          class: '',
        });
      }
    }

    for (const [fingerprint, nickname] of Object.entries(
      result.cachedValue.state.nicknames
    )) {
      nicknames[fingerprint] = nickname;
    }

    for (const [userAddress, fingerprints] of Object.entries(
      result.cachedValue.state.registrationCredits
    )) {
      if (address === userAddress) {
        for (const fingerprint of fingerprints as string[]) {
          registrationCredits.push(fingerprint);
        }
      }
    }

    return {
      timestamp: Date.now(),
      data: {
        verified: verifiedRelays as [
          {
            address: string;
            fingerprint: string;
            status: string;
            active: boolean;
            class: string;
          },
        ],
        claimable: claimableRelays as [
          {
            address: string;
            fingerprint: string;
            status: string;
            active: boolean;
            class: string;
          },
        ],
        nicknames: nicknames,
        registrationCredits: registrationCredits,
      },
    };
  } catch (error) {
    return undefined;
  }
};
