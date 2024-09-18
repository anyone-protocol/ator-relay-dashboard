export interface DataItem {
  data: string | Uint8Array;
  target?: string;
  anchor?: string;
  tags?: {
    name: string;
    value: string;
  }[];
}
