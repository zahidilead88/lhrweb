export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: {
    retries?: number;
    delays?: number[];
    retryOn?: number[];
  } = {}
): Promise<T> {
  const {
    retries = 3,
    delays = [2000, 5000, 15000],
    retryOn = [500, 502, 503, 0],
  } = opts;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e: unknown) {
      // A deliberate abort (unmount / superseded save) is never retryable
      if (e instanceof Error && e.name === "AbortError") throw e;

      const status =
        e && typeof e === "object" && "status" in e
          ? (e as { status: number }).status
          : 0;

      if (i === retries) throw e;

      // 429 is special: retry once after Retry-After
      if (status === 429) {
        const retryAfter =
          e && typeof e === "object" && "retryAfter" in e
            ? (e as { retryAfter: number }).retryAfter
            : 5;
        await sleep(retryAfter * 1000);
        continue;
      }

      if (!retryOn.includes(status)) throw e;
      await sleep(delays[i]);
    }
  }

  throw new Error("Unreachable");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
