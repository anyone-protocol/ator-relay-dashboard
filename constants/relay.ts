import type { RelayTabType } from '~/types/relay';

const defaultColumns: {
  key: string;
  label?: string;
}[] = [
  {
    key: 'fingerprint',
    label: 'Relay Fingerprint',
  },
  {
    key: 'nickname',
    label: 'Nickname',
  },
  {
    key: 'active',
    label: 'Running',
  },
  {
    key: 'observedBandwidth',
    label: 'Observed Bandwidth',
  },
  // {
  //   key: 'consensusWeight',
  //   label: 'Consensus Weight',
  // },
  {
    key: 'previousDistribution',
    label: 'Previous Distribution',
  },

  {
    key: 'lockStatus',
    label: 'Lock Status',
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
      key: 'nickname',
      label: 'Nickname',
    },
    {
      key: 'observedBandwidth',
      label: 'Observed Bandwith',
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
