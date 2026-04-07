function isAbort(signal) {
  return signal?.aborted ?? false;
}

function checkAbort(signal) {
  if (isAbort(signal)) {
    throw new Error(String(signal?.reason ?? 'Aborted'));
  }
}

function runHashLikeText(text, rounds, signal, reporter) {
  const input = String(text ?? 'tuiuiu');
  const total = input.length * rounds;
  let hash = 0;

  for (let i = 0; i < total; i += 1) {
    const code = input.charCodeAt(i % input.length);
    hash = (Math.imul(hash, 16777619) ^ code) >>> 0;

    if (i % 25000 === 0) {
      checkAbort(signal);
      reporter.emit('progress', {
        phase: 'hash-text',
        processed: i + 1,
        total,
        ratio: (i + 1) / total,
      });
    }
  }

  return {
    method: 'hash-text',
    hash,
    rounds,
    processed: total,
  };
}

function countPrimes(limit, signal, reporter) {
  const max = Math.max(2, Math.floor(Number(limit) || 0));
  let count = 0;
  const seen = new Uint8Array(max + 1);
  const reportEvery = Math.max(1, Math.floor(max / 10));

  for (let value = 2; value <= max; value += 1) {
    if (isAbort(signal)) {
      throw new Error('Aborted');
    }

    if (seen[value]) {
      continue;
    }

    count += 1;
    if (value * value <= max) {
      for (let multiple = value * value; multiple <= max; multiple += value) {
        seen[multiple] = 1;
      }
    }

    if (value % reportEvery === 0 || value === max) {
      reporter.emit('progress', {
        phase: 'prime-range',
        processed: value,
        total: max,
        ratio: value / max,
      });
    }
  }

  return {
    method: 'prime-range',
    totalChecked: max,
    primes: count,
  };
}

export const backgroundTaskHandlers = {
  async hashText(payload, signal, reporter) {
    return runHashLikeText(payload.text, payload.rounds, signal, reporter);
  },

  async primeRange(payload, signal, reporter) {
    return countPrimes(payload.limit, signal, reporter);
  },
};

export default backgroundTaskHandlers;
