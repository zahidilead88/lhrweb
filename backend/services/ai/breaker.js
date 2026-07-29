// Ch 7.2 / Ch 10 — in-memory circuit breaker for the AI provider.
// Opens when the recent error rate is high; half-open lets a probe call through.

const WINDOW_MS   = 30 * 60 * 1000;  // look at the last 30 min
const MIN_CALLS   = 8;               // don't judge on tiny samples
const OPEN_RATE   = 0.5;             // >50% failures → open
const COOLDOWN_MS = 5 * 60 * 1000;   // stay open 5 min, then half-open probe

const calls = [];       // { at, ok }
let openedAt = null;
let probing = false;
let probeAt = null;
const PROBE_TIMEOUT_MS = 90 * 1000;  // a probe that never reports back expires

function prune() {
  const cutoff = Date.now() - WINDOW_MS;
  while (calls.length && calls[0].at < cutoff) calls.shift();
}

function record(ok) {
  prune();
  calls.push({ at: Date.now(), ok });
  if (calls.length > 200) calls.shift();

  if (openedAt && ok) { openedAt = null; probing = false; probeAt = null; }   // probe succeeded → close
  else if (openedAt && !ok) { openedAt = Date.now(); probing = false; probeAt = null; } // probe failed → stay open

  if (!openedAt) {
    const fails = calls.filter((c) => !c.ok).length;
    if (calls.length >= MIN_CALLS && fails / calls.length > OPEN_RATE) {
      openedAt = Date.now();
      console.error(`AI circuit breaker OPEN — ${fails}/${calls.length} recent calls failed`);
    }
  }
}

// returns true if the call should be rejected with 503
function isOpen() {
  if (!openedAt) return false;
  if (probing && probeAt && Date.now() - probeAt > PROBE_TIMEOUT_MS) {
    probing = false;     // probe went missing — allow a fresh one
    probeAt = null;
  }
  if (Date.now() - openedAt >= COOLDOWN_MS && !probing) {
    probing = true;      // half-open: let exactly one call through as a probe
    probeAt = Date.now();
    return false;
  }
  return true;
}

function state() {
  return openedAt ? (probing ? "half-open" : "open") : "closed";
}

module.exports = { record, isOpen, state };
