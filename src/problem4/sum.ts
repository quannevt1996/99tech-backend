// O(n) time, O(1) space. Simplest, but it does n additions.
export const sum_to_n_a = (n: number): number => {
  let sum = 0;
  for (let i = 1; i <= Math.abs(n); i++) {
    sum += i;
  }
  return n < 0 ? -sum : sum;
};

// O(1) time and space, the one I'd use. For the largest allowed n, n * (n + 1) goes over
// MAX_SAFE_INTEGER, but it's always even and below 2^54, so the result is still exact.
export const sum_to_n_b = (n: number): number => {
  const sum = (Math.abs(n) * (Math.abs(n) + 1)) / 2;
  return n < 0 ? -sum : sum;
};

// O(log n) time and O(log n) stack. sum(2k) = 2 * sum(k) + k * k, plus n when n is odd.
// Plain n + sum(n - 1) recursion overflows the stack at around n = 8000.
export const sum_to_n_c = (n: number): number => {
  if (n < 0) {
    return -sum_to_n_c(-n);
  }
  if (n < 2) {
    return n;
  }
  const half = Math.floor(n / 2);
  const upToEven = 2 * sum_to_n_c(half) + half * half;
  return n % 2 === 0 ? upToEven : upToEven + n;
};
