export const RELAY_COLUMS = [
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
