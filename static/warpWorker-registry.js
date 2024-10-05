import { WarpFactory } from 'warp-contracts';
import { EthersExtension } from 'warp-contracts-plugin-ethers';

let warp = null;
let contracts = {
  relayRegistry: null,
  distribution: null,
};

// Initialize the runningTasks object for different task types
let runningTasks = {
  readState: {},
  viewState: {},
};

const MAX_TASK_DURATION = 10000; // 10 seconds timeout for each task

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

  // Ensure only one task is running at a time for readState or viewState
  switch (task) {
    case 'readState':
      if (isTaskRunning('readState', payload.contractName)) {
        self.postMessage({
          task,
          error: `readState task is already running for contract ${payload.contractName}`,
        });
        return;
      }
      await executeTaskWithTimeout(
        () => runReadState(contract, payload),
        task,
        payload.contractName,
        'readState'
      );
      break;

    case 'viewState':
      if (
        isTaskRunning('viewState', payload.contractName, payload.functionName)
      ) {
        self.postMessage({
          task,
          error: `viewState task is already running for contract ${payload.contractName} and function ${payload.functionName}`,
        });
        return;
      }
      await executeTaskWithTimeout(
        () => runViewState(contract, payload),
        task,
        payload.contractName,
        'viewState',
        payload.functionName
      );
      break;

    default:
      self.postMessage({ task, error: 'Unknown task' });
      break;
  }
};

self.postMessage({ task: 'workerReady' });

// Helper to check if a task is running
function isTaskRunning(taskType, contractName, functionName = null) {
  return functionName
    ? runningTasks[taskType]?.[`${contractName}:${functionName}`]
    : runningTasks[taskType]?.[contractName];
}

// Helper to set task status
function setTaskStatus(
  taskType,
  contractName,
  functionName = null,
  status = false
) {
  // Initialize taskType if it's not yet defined
  if (!runningTasks[taskType]) {
    runningTasks[taskType] = {};
  }

  const taskKey = functionName
    ? `${contractName}:${functionName}`
    : contractName;
  runningTasks[taskType][taskKey] = status;
}

// Execute task with timeout logic
async function executeTaskWithTimeout(
  taskFn,
  task,
  contractName,
  taskType,
  functionName = null
) {
  const taskKey = functionName
    ? `${contractName}:${functionName}`
    : contractName;

  // Set the task as running
  setTaskStatus(taskType, contractName, functionName, true);

  // Create a promise for the task
  const taskPromise = taskFn();

  // Create a timeout to terminate if it exceeds 60 seconds
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => {
      reject(`Task timed out after 60 seconds: ${task}`);
    }, MAX_TASK_DURATION)
  );

  try {
    await Promise.race([taskPromise, timeoutPromise]);
  } catch (error) {
    self.postMessage({
      task,
      contractName,
      functionName,
      error,
    });
  } finally {
    // Mark the task as completed
    setTaskStatus(taskType, contractName, functionName, false);
  }
}

// Task handlers
async function runReadState(contract, payload) {
  try {
    const result = await contract.readState();
    self.postMessage({
      task: 'readState',
      contractName: payload.contractName,
      result: result,
    });
  } catch (error) {
    self.postMessage({
      task: 'readState',
      contractName: payload.contractName,
      error,
    });
  }
}

async function runViewState(contract, payload) {
  try {
    const { result } = await contract.viewState({
      function: payload.functionName,
      address: payload.address,
    });
    self.postMessage({
      task: 'viewState',
      contractName: payload.contractName,
      functionName: payload.functionName,
      result,
    });
  } catch (error) {
    self.postMessage({
      task: 'viewState',
      contractName: payload.contractName,
      functionName: payload.functionName,
      error,
    });
  }
}
