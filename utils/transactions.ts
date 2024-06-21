import ArdbTransaction from 'ardb/lib/models/transaction';

export const parseTimestampTag = (tx: ArdbTransaction): number | null => {
  const timestamp = parseInt(
    tx.tags.find((tag) => tag.name === 'Content-Timestamp')?.value || ''
  );

  return Number.isNaN(timestamp) ? null : timestamp;
};
