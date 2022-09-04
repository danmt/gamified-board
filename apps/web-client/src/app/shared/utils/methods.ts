import { Option } from './types';

export function isNull<T>(x: Option<T>): x is null {
  return x === null;
}

export function isNotNull<T>(x: Option<T>): x is T {
  return x !== null;
}
