import type { RelayTabType } from '~/types/relay';

const defaultColumns: {
  key: string;
  label?: string;
}[] = [
  {
    key: 'nickname',
    label: 'Nickname',
  },
  {
    key: 'fingerprint',
    label: 'Relay fingerprint',
  },
  {
    key: 'active',
    label: 'Running',
  },
  {
    key: 'consensusWeight',
    label: 'Consensus weight',
  },
  {
    key: 'observedBandwidth',
    label: 'Observed bandwidth',
  },
  // {
  //   key: 'lockStatus',
  //   label: 'Lock Status',
  // },
  {
    key: 'status',
    label: 'Registration Status',
  },
  {
    key: 'actions',
  },
];

export const RELAY_COLUMS: Record<
  RelayTabType,
  {
    key: string;
    label?: string;
  }[]
> = {
  all: defaultColumns,
  claimable: defaultColumns,
  locked: [
    {
      key: 'owner',
      label: 'Ownership',
    },
    {
      key: 'nickname',
      label: 'Nickname',
    },
    {
      key: 'fingerprint',
      label: 'Relay fingerprint',
    },
    {
      key: 'consensusWeight',
      label: 'Consensus weight',
    },
    {
      key: 'lockStatus',
      label: 'Lock Status',
    },
    {
      key: 'unlock',
      label: 'Actions',
    },
  ],
};

export const TABS = [
  {
    label: 'All relays',
    key: 'all',
  },
  {
    label: 'Claimable relays',
    key: 'claimable',
  },
  // {
  //   label: 'Locked Relays',
  //   key: 'locked',
  // },
];

export const VERBS = {
  claim: {
    pastTense: 'claimed',
    presentTense: 'claiming',
  },
  renounce: {
    pastTense: 'renounced',
    presentTense: 'renouncing',
  },
  register: {
    pastTense: 'registered',
    presentTense: 'registering',
  },
};
