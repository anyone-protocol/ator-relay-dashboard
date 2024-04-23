export const truncatedAddress = (address: string): string =>
  `${address.substring(0, 10)}...${address.substring(address.length - 4)}`;
