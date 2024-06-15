import { debounce } from 'lodash';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export default (fn: (...args: any) => any) => {
  return debounce(fn, 300, { leading: true, trailing: false });
};
