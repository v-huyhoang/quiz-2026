import { useEffect, useRef } from "react";

/**
 * Polls an async function at a fixed interval.
 * The next poll only starts after the previous one resolves (no overlap).
 */
export function usePolling(
  fn: () => Promise<void>,
  intervalMs: number,
  enabled = true,
) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await fnRef.current().catch(() => {});
      if (!cancelled) setTimeout(run, intervalMs);
    };

    run();
    return () => { cancelled = true; };
  }, [intervalMs, enabled]);
}
