export const RELAY_COLUMS = [
  {
    key: 'fingerprint',
    label: 'Relay fingerprint',
  },
  {
    key: 'status',
    label: 'Status',
  },
  {
    key: 'consensusWeight',
    label: 'Consensus weight',
  },
  {
    key: 'observedBandwidth',
    label: 'Observed bandwidth',
  },
  {
    key: 'active',
    label: 'Active',
  },
  {
    key: 'actions',
  },
];

export const TABS = [
  {
    label: 'All relays',
    key: 'all',
  },
  {
    label: 'Claimable relays',
    key: 'claimable',
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
