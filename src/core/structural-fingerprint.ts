const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export interface FingerprintOptions {
  ignoreKeys?: ReadonlySet<string>;
  ignoreFunctions?: boolean;
}

function mixChar(hash: number, code: number): number {
  hash ^= code;
  return Math.imul(hash, FNV_PRIME) >>> 0;
}

function mixString(hash: number, value: string): number {
  let next = hash;
  for (let index = 0; index < value.length; index++) {
    next = mixChar(next, value.charCodeAt(index)!);
  }
  return next;
}

function hashValue(hash: number, value: unknown, options: FingerprintOptions): number {
  if (value === undefined) {
    return mixChar(hash, 0x75); // u
  }

  if (value === null) {
    return mixChar(hash, 0x6e); // n
  }

  switch (typeof value) {
    case 'boolean':
      return mixChar(mixChar(hash, 0x62), value ? 0x31 : 0x30); // b1 / b0
    case 'number':
      return mixString(mixChar(hash, 0x64), Object.is(value, -0) ? '-0' : String(value)); // d
    case 'bigint':
      return mixString(mixChar(hash, 0x69), value.toString()); // i
    case 'string':
      return mixString(mixChar(hash, 0x73), value); // s
    case 'function':
      return options.ignoreFunctions === false ? mixChar(hash, 0x66) : hash; // f
    case 'object': {
      if (Array.isArray(value)) {
        let next = mixChar(hash, 0x5b); // [
        for (const entry of value) {
          next = hashValue(next, entry, options);
          next = mixChar(next, 0x7c); // |
        }
        return mixChar(next, 0x5d); // ]
      }

      let next = mixChar(hash, 0x7b); // {
      const record = value as Record<string, unknown>;
      const keys = Object.keys(record).sort();
      for (const key of keys) {
        if (options.ignoreKeys?.has(key)) {
          continue;
        }

        const entry = record[key];
        if (entry === undefined) {
          continue;
        }
        if (typeof entry === 'function' && options.ignoreFunctions !== false) {
          continue;
        }

        next = mixString(mixChar(next, 0x6b), key); // k
        next = mixChar(next, 0x3a); // :
        next = hashValue(next, entry, options);
        next = mixChar(next, 0x3b); // ;
      }
      return mixChar(next, 0x7d); // }
    }
    default:
      return mixString(mixChar(hash, 0x3f), String(value)); // ?
  }
}

export function fingerprintValue(value: unknown, options: FingerprintOptions = {}): string {
  return hashValue(FNV_OFFSET_BASIS, value, {
    ignoreFunctions: true,
    ...options,
  }).toString(16);
}
