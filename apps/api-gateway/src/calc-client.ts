import {
  calculateResponseSchema,
  ERROR_CODES,
  errorResponseSchema,
  type CalculateRequest,
  type ErrorCode,
} from "@repo/contracts";

/** The codes calc-service answers 422 with; the only ones a domain error carries. */
export type DomainErrorCode = Extract<
  ErrorCode,
  "DIVISION_BY_ZERO" | "NEGATIVE_SQRT" | "RESULT_NOT_FINITE"
>;

/**
 * Every downstream conversation, reduced to one of three outcomes. The route
 * switches on `kind` and never sees a `Response`, a status or a thrown error.
 */
export type CalcOutcome =
  | { kind: "result"; result: number }
  | { kind: "domain-error"; code: DomainErrorCode; message: string }
  | { kind: "unavailable"; reason: "unreachable" | "timeout" };

/** The shape of `fetch` the client needs; the global one fits, and a test passes a fake. */
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
 * What a downstream answer means, decided by the contract's schemas and never
 * by trust: a 200 that parses as a result is a result; a 422 that parses as an
 * envelope with a domain code is a domain error; anything else is unreachable.
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

/** The pause between a refused connection and the one retry. A constant: nothing in P0 or P1 tunes it. */
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
    // One deadline covers the whole call, retry included; the signal reaches
    // the real fetch so a hung socket is released when it fires.
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), timeoutMs);

    // Re-serialised from the validated fields, so nothing the caller sent
    // beyond the contract's two keys reaches the downstream.
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
    // A refusal already observed has answered "is it down or slow?", so the
    // deadline expiring afterwards is still unreachable; timeout is reserved
    // for a call in which nothing was ever refused.
    let refused = false;
    const expired = (): CalcOutcome => (refused ? unreachable : timeout);

    const attempts = async (): Promise<CalcOutcome> => {
      try {
        return await attempt();
      } catch {
        // The real fetch rejects when its signal aborts: that is the deadline
        // speaking, not the network, and it is read as such whichever listener
        // ran first.
        if (controller.signal.aborted) return expired();
        // Any other rejection is a connection-level failure — refused, reset —
        // and a calc-service restarting between requests deserves one more try.
        refused = true;
        await pause(RETRY_PAUSE_MS, controller.signal);
        if (controller.signal.aborted) return expired();
        return attempt().catch(() => unreachable);
      }
    };

    try {
      // Raced, not merely signalled: a fetch that ignores the signal still
      // cannot hold the call past the deadline.
      return await Promise.race([
        attempts(),
        onAbort(controller.signal).then(expired),
      ]);
    } finally {
      clearTimeout(deadline);
    }
  };
};
