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

  let contractUrl = `https://dre.ec.anyone.tech/contract?id=${payload.contractId}`;

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
        () => fetchReadState(contractUrl, payload.contractName),
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
        () =>
          fetchViewState(
            contractUrl,
            payload.functionName,
            payload.contractName
          ),
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

  // Create a timeout to terminate if it exceeds 10 seconds
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => {
      reject(
        `Task timed out after ${MAX_TASK_DURATION / 1000} seconds: ${task}`
      );
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

// Fetch readState from the API endpoint
async function fetchReadState(contractUrl, contractName) {
  try {
    console.log('fetchReadState', contractUrl);
    const response = await fetch(contractUrl);
    const data = await response.json();
    let result = {
      cachedValue: { state: null },
    };

    if (data.state) {
      result.cachedValue.state = data.state;
      console.log('result', data.state);
      self.postMessage({
        task: 'readState',
        contractName: contractName,
        result: result,
      });
    } else {
      self.postMessage({
        task: 'readState',
        error: 'Failed to fetch readState',
      });
    }
  } catch (error) {
    self.postMessage({
      task: 'readState',
      error: error.message,
    });
  }
}

// Fetch viewState (specific function result) from the API endpoint
async function fetchViewState(contractUrl, functionName, contractName) {
  try {
    const response = await fetch(contractUrl);
    const data = await response.json();

    if (data.state && data.state[functionName]) {
      self.postMessage({
        task: 'viewState',
        contractName: contractName,
        functionName: functionName,
        result: data.state[functionName],
      });
    } else {
      self.postMessage({
        task: 'viewState',
        error: `Failed to fetch viewState for function ${functionName}`,
      });
    }
  } catch (error) {
    self.postMessage({
      task: 'viewState',
      functionName,
      error: error.message,
    });
  }
}
