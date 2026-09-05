import {
  calculateResponseSchema,
  ERROR_CODES,
  errorResponseSchema,
  type CalculateRequest,
  type ErrorCode,
} from "@repo/contracts";

/** The codes calc-service answers 422 with. */
export type DomainErrorCode = Extract<
  ErrorCode,
  "DIVISION_BY_ZERO" | "NEGATIVE_SQRT" | "RESULT_NOT_FINITE"
>;

/**
 * One downstream call, reduced to three outcomes. The route switches on `kind`
 * and never sees a `Response`, a status or a thrown error.
 */
export type CalcOutcome =
  | { kind: "result"; result: number }
  | { kind: "domain-error"; code: DomainErrorCode; message: string }
  | { kind: "unavailable"; reason: "unreachable" | "timeout" };

/** The slice of `fetch` the client needs; tests pass a fake. */
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export type CalcClientOptions = {
  /** calc-service's base URL; `/calculate` is joined onto it. */
  calcServiceUrl: string;
  /** The whole-call deadline, retry included. */
  timeoutMs: number;
  /** Defaults to the global `fetch`. */
  fetch?: FetchLike;
};

export type CalcClient = (request: CalculateRequest) => Promise<CalcOutcome>;

const DOMAIN_ERROR_CODES: ReadonlySet<ErrorCode> = new Set<DomainErrorCode>([
  ERROR_CODES.DIVISION_BY_ZERO,
  ERROR_CODES.NEGATIVE_SQRT,
  ERROR_CODES.RESULT_NOT_FINITE,
]);

const isDomainErrorCode = (code: ErrorCode): code is DomainErrorCode =>
  DOMAIN_ERROR_CODES.has(code);

/** The body parsed, or `undefined` when it is not JSON. */
const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

/**
 * A 200 that parses as a result is a result; a 422 that parses as an envelope
 * with a domain code is a domain error; anything else is unreachable.
 */
const classify = (status: number, body: unknown): CalcOutcome => {
  if (status === 200) {
    const parsed = calculateResponseSchema.safeParse(body);
    if (parsed.success) return { kind: "result", result: parsed.data.result };
  }
  if (status === 422) {
    const parsed = errorResponseSchema.safeParse(body);
    if (parsed.success) {
      const { code, message } = parsed.data.error;
      if (isDomainErrorCode(code))
        return { kind: "domain-error", code, message };
    }
  }
  return { kind: "unavailable", reason: "unreachable" };
};

/** Pause before the one retry after a refused connection. Not configurable: no requirement tunes it. */
const RETRY_PAUSE_MS = 100;

/** Resolves after `ms`, or at once when `signal` aborts first. */
const pause = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });

/** `<base>/calculate`, whether or not the base already ends in a slash. */
const calculateUrl = (base: string): string =>
  `${base.replace(/\/+$/, "")}/calculate`;

/** Resolves once `signal` aborts. */
const onAbort = (signal: AbortSignal): Promise<void> =>
  new Promise((resolve) =>
    signal.addEventListener("abort", () => resolve(), { once: true }),
  );

/** A client bound to one calc-service URL, deadline and fetch. */
export const createCalcClient = ({
  calcServiceUrl,
  timeoutMs,
  fetch = globalThis.fetch,
}: CalcClientOptions): CalcClient => {
  const url = calculateUrl(calcServiceUrl);

  return async ({ operation, operands }) => {
    // One deadline for the whole call, retry included; the signal also frees
    // a hung socket.
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), timeoutMs);

    // Rebuilt from the validated fields so extra caller keys never reach the
    // downstream.
    const init: RequestInit = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operation, operands }),
      signal: controller.signal,
    };
    const attempt = async (): Promise<CalcOutcome> => {
      const response = await fetch(url, init);
      return classify(response.status, parseJson(await response.text()));
    };
    const unreachable: CalcOutcome = {
      kind: "unavailable",
      reason: "unreachable",
    };
    const timeout: CalcOutcome = { kind: "unavailable", reason: "timeout" };
    // Once a connection was refused the service is down, not slow: a deadline
    // expiring after that still reports unreachable.
    let refused = false;
    const expired = (): CalcOutcome => (refused ? unreachable : timeout);

    const attempts = async (): Promise<CalcOutcome> => {
      try {
        return await attempt();
      } catch {
        // A rejection after abort is the deadline, not the network, whichever
        // listener ran first.
        if (controller.signal.aborted) return expired();
        // Any other rejection is a refused or reset connection; retry once for
        // a calc-service mid-restart.
        refused = true;
        await pause(RETRY_PAUSE_MS, controller.signal);
        if (controller.signal.aborted) return expired();
        return attempt().catch(() => unreachable);
      }
    };

    try {
      // Raced so a fetch that ignores the signal cannot hold the call past
      // the deadline.
      return await Promise.race([
        attempts(),
        onAbort(controller.signal).then(expired),
      ]);
    } finally {
      clearTimeout(deadline);
    }
  };
};
