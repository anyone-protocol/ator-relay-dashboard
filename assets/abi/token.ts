export const tokenAbi = [
    {
      type: 'constructor',
      inputs: [
        { name: 'initialSupply', internalType: 'uint256', type: 'uint256' },
      ],
      stateMutability: 'nonpayable',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        {
          name: 'owner',
          internalType: 'address',
          type: 'address',
          indexed: true,
        },
        {
          name: 'spender',
          internalType: 'address',
          type: 'address',
          indexed: true,
        },
        {
          name: 'value',
          internalType: 'uint256',
          type: 'uint256',
          indexed: false,
        },
      ],
      name: 'Approval',
    },
    {
      type: 'event',
      anonymous: false,
      inputs: [
        { name: 'from', internalType: 'address', type: 'address', indexed: true },
        { name: 'to', internalType: 'address', type: 'address', indexed: true },
        {
          name: 'value',
          internalType: 'uint256',
          type: 'uint256',
          indexed: false,
        },
      ],
      name: 'Transfer',
    },
    {
      type: 'function',
      inputs: [
        { name: 'owner', internalType: 'address', type: 'address' },
        { name: 'spender', internalType: 'address', type: 'address' },
      ],
      name: 'allowance',
      outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      inputs: [
        { name: 'spender', internalType: 'address', type: 'address' },
        { name: 'amount', internalType: 'uint256', type: 'uint256' },
      ],
      name: 'approve',
      outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      inputs: [],
      name: 'decimals',
      outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      inputs: [
        { name: 'spender', internalType: 'address', type: 'address' },
        { name: 'subtractedValue', internalType: 'uint256', type: 'uint256' },
      ],
      name: 'decreaseAllowance',
      outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      inputs: [
        { name: 'spender', internalType: 'address', type: 'address' },
        { name: 'addedValue', internalType: 'uint256', type: 'uint256' },
      ],
      name: 'increaseAllowance',
      outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      inputs: [],
      name: 'name',
      outputs: [{ name: '', internalType: 'string', type: 'string' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      inputs: [],
      name: 'symbol',
      outputs: [{ name: '', internalType: 'string', type: 'string' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      inputs: [],
      name: 'totalSupply',
      outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      inputs: [
        { name: 'to', internalType: 'address', type: 'address' },
        { name: 'amount', internalType: 'uint256', type: 'uint256' },
      ],
      name: 'transfer',
      outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      inputs: [
        { name: 'from', internalType: 'address', type: 'address' },
        { name: 'to', internalType: 'address', type: 'address' },
        { name: 'amount', internalType: 'uint256', type: 'uint256' },
      ],
      name: 'transferFrom',
      outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
      stateMutability: 'nonpayable',
    },
  ] as const