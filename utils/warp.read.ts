import { isAddress } from 'viem';
import { relayRegistryContract } from '@/config/warp.config';
import { responseOutput } from '@/utils/responseOutput';
import { useUserStore } from '#imports';

type FunctionName = 'verified' | 'claimable' | 'serials';

type RelayData = {
  timestamp: number;
  data: {
    state: any;
    verifiedHardware: { [key: string]: Number };
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
    registrationCreditsRequired: boolean;
    families: { [key: string]: string[] };
    familyRequired: boolean;
  };
};

var test = '0xECc33A2782041fC5D032B214a22a596e1BC6a35b';

const warpWorker = new Worker(
  new URL('@/static/warpWorker-registry-DreNode.js', import.meta.url),
  {
    type: 'module',
  }
);
const runtimeConfig = useRuntimeConfig();

// getting the relays, either claimed or verified, by using corresponding function name and user's EVM address.
export const warpRead = async (
  address: `0x${string}`,
  functionName: FunctionName
): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!address) {
      resolve(
        responseOutput({
          status: 400,
          message: 'No address provided',
        })
      );
      return;
    }

    if (!isAddress(address)) {
      resolve(
        responseOutput({
          status: 400,
          message: 'Invalid address provided',
        })
      );
      return;
    }

    // Send the request to the warpWorker
    warpWorker.postMessage({
      task: 'viewState',
      payload: {
        contractId: runtimeConfig.public.relayRegistryAddress,
        contractName: 'relayRegistry',
        functionName: functionName,
        address: address,
      },
    });

    // Listen for the response from the worker
    const handleMessage = (e: MessageEvent) => {
      const { task, result, error, contractName, functionName } = e.data;

      if (
        task === 'viewState' &&
        contractName === 'relayRegistry' &&
        functionName === functionName
      ) {
        if (error) {
          resolve(
            responseOutput({
              data: error,
              status: 500,
              message: 'Error fetching state from warpWorker',
            })
          );
        } else {
          const relays = result.map((relay: string) => ({
            fingerprint: relay,
            status: functionName,
            active: true,
            class: '',
          }));

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
        }
      }
      warpWorker.removeEventListener('message', handleMessage);
    };

    warpWorker.addEventListener('message', handleMessage);
  });
};

export const warpReadSerials = async (
  address: `0x${string}`
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
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

    // Send the request to the warpWorker
    warpWorker.postMessage({
      task: 'viewState',
      payload: {
        contractId: runtimeConfig.public.relayRegistryAddress,
        contractName: 'relayRegistry',
        functionName: 'serials',
        address: address,
      },
    });

    // Listen for the response from the worker
    const handleMessage = (e: MessageEvent) => {
      const { task, result, error, contractName, functionName } = e.data;

      if (
        task === 'viewState' &&
        contractName === 'relayRegistry' &&
        functionName === functionName
      ) {
        if (error) {
          resolve([]);
        } else {
          const serials = Object.keys(
            (result.serials as Record<string, object>) || {}
          );

          resolve(serials);
        }
      }
      warpWorker.removeEventListener('message', handleMessage);
    };

    warpWorker.addEventListener('message', handleMessage);
  });
};

export const readNickNames = async (): Promise<Record<
  string,
  string
> | null> => {
  return new Promise((resolve) => {
    // Send the readState task to the worker
    warpWorker.postMessage({
      task: 'readState',
      payload: {
        contractId: runtimeConfig.public.relayRegistryAddress,
        contractName: 'relayRegistry',
      },
    });

    // Handle the response from the worker
    warpWorker.onmessage = (e) => {
      const { task, result } = e.data;

      if (task === 'readState') {
        resolve(result?.nicknames || null);
      }
    };
  });
};

export const getAllRelays = async (
  address: `0x${string}`
): Promise<RelayData | undefined> => {
  return new Promise((resolve, reject) => {
    try {
      const contractId = runtimeConfig.public.relayRegistryAddress;

      warpWorker.postMessage({
        task: 'readState',
        payload: {
          contractId: contractId,
          contractName: 'relayRegistry',
        },
      });
      const handleMessage = (e: MessageEvent) => {
        const { task, contractName, result, error } = e.data;
        console.log('handleMessage', task, contractName, result, error);

        if (task === 'readState' && contractName === 'relayRegistry') {
          if (error) {
            reject(`Error reading state: ${error}`);
            resolve(undefined);
            return;
          }

          if (!result?.cachedValue?.state) {
            reject('Invalid state from relayRegistryContract');
            resolve(undefined);
            return;
          }
          const verifiedRelays = [];
          const claimableRelays = [];
          const registrationCredits = [];
          const nicknames: { [key: string]: any } = {};
          const families: { [key: string]: string[] } = {};
          let registrationCreditsRequired: boolean = false;
          var familyRequired: boolean = false;
          const userStore = useUserStore();

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

          for (const [fingerprint, array] of Object.entries(
            result.cachedValue.state.families
          )) {
            var fingerprintArray = array as string[];
            families[fingerprint] = fingerprintArray;
          }

          familyRequired = result.cachedValue.state.familyRequired;
          registrationCreditsRequired =
            result.cachedValue.state.registrationCreditsRequired;

          resolve({
            timestamp: Date.now(),
            data: {
              state: result.cachedValue.state,
              verifiedHardware: result.cachedValue.state.verifiedHardware,
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
              families: families,
              registrationCreditsRequired: registrationCreditsRequired,
              familyRequired: familyRequired,
            },
          });
          warpWorker!.removeEventListener('message', handleMessage);
          return;
        }
      };

      warpWorker!.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('Error in getAllRelays:', error);
      reject('Error in getAllRelays');
      resolve(undefined);
    }
  });
};
