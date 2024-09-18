import { WarpFactory } from 'warp-contracts';
import { EthersExtension } from 'warp-contracts-plugin-ethers';

let warp = null;
let contracts = {
  relayRegistry: null,
  distribution: null,
};

self.onmessage = async (event) => {
  const { task, payload } = event.data;

  if (!warp) {
    warp = WarpFactory.forMainnet({
      inMemory: true,
      dbLocation: './cache/warp',
    }).use(new EthersExtension());
  }

  // Initialize relayRegistry contract only if not initialized
  if (payload.contractName === 'relayRegistry' && !contracts.relayRegistry) {
    contracts.relayRegistry = warp.contract(payload.contractId);
    contracts.relayRegistry.setEvaluationOptions({
      remoteStateSyncEnabled: true,
    });
  }

  // Initialize distribution contract only if not initialized
  if (payload.contractName === 'distribution' && !contracts.distribution) {
    contracts.distribution = warp.contract(payload.contractId);
    contracts.distribution.setEvaluationOptions({
      remoteStateSyncEnabled: true,
    });
  }

  let contract = contracts[payload.contractName];

  if (!contract) {
    self.postMessage({
      task,
      error: `Unknown contract ID: ${payload.contractId}`,
    });
    return;
  }

  switch (task) {
    case 'readState':
      try {
        const result = await contract.readState();
        console.log('readState result:', result);
        self.postMessage({ task: 'readState', result: result });
      } catch (error) {
        console.error(`Error reading state from ${payload.contractId}:`, error);
        self.postMessage({ task: 'readState', error });
      }
      break;

    case 'viewState':
      try {
        const { result } = await contract.viewState({
          function: payload.functionName,
          address: payload.address,
        });
        self.postMessage({ task: 'viewState', result });
      } catch (error) {
        console.error(`Error viewing state from ${payload.contractId}:`, error);
        self.postMessage({ task: 'viewState', error });
      }
      break;

    case 'claimable':
      try {
        const { result: claimable } = await contract.viewState({
          function: 'claimable',
          address: payload.address,
        });
        const claimableValue = claimable ? claimable : '0';
        self.postMessage({ task: 'claimable', result: claimableValue });
      } catch (error) {
        console.error(
          `Error in claimable viewState for ${payload.contractId}:`,
          error
        );
        self.postMessage({ task: 'claimable', error });
      }
      break;

    default:
      self.postMessage({ task, error: 'Unknown task' });
      break;
  }
};
self.postMessage({ task: 'workerReady' });
