import type { RelayTabType } from '~/types/relay';

const defaultColumns: {
  key: string;
  label?: string;
}[] = [
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
    key: 'previousDistribution',
    label: 'Previous Distribution',
  },
  {
    key: 'lockStatus',
    label: 'Lock Status',
  },
  {
    key: 'nickname',
    label: 'Nickname',
  },
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
      key: 'fingerprint',
      label: 'Relay fingerprint',
    },
    {
      key: 'consensusWeight',
      label: 'Consensus weight',
    },
    {
      key: 'previousDistribution',
      label: 'Previous Distribution',
    },
    {
      key: 'lockStatus',
      label: 'Lock Status',
    },
    {
      key: 'nickname',
      label: 'Nickname',
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
  {
    label: 'Locked Relays',
    key: 'locked',
  },
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
