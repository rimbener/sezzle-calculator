import { ERROR_MESSAGES, type CalculateRequest } from "@repo/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createCalcClient, type FetchLike } from "./calc-client.ts";

const REQUEST: CalculateRequest = { operation: "add", operands: [1, 2] };

/** A downstream reply: `status` with `body` serialised as JSON. */
const reply = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

/** A fetch that answers every call the same way. */
const answering = (status: number, body: unknown) =>
  vi.fn<FetchLike>(async () => reply(status, body));

const client = (fetch: FetchLike, calcServiceUrl = "http://calc:3001") =>
  createCalcClient({ calcServiceUrl, timeoutMs: 3000, fetch });

/** What a refused or reset connection looks like from `fetch`: a rejection, never a `Response`. */
const refused = () => new TypeError("fetch failed");

/** A downstream that accepts the connection and never answers. */
const hanging = () => vi.fn<FetchLike>(() => new Promise<Response>(() => {}));

/** Like `hanging`, but honouring the signal the way the real fetch does: rejecting with an AbortError on abort. */
const hangingUntilAborted = () =>
  vi.fn<FetchLike>(
    (_url, init) =>
      new Promise<Response>((_resolve, reject) =>
        init.signal?.addEventListener("abort", () =>
          reject(new DOMException("This operation was aborted", "AbortError")),
        ),
      ),
  );

/** Whether `promise` has settled, without awaiting it. */
const settled = (promise: Promise<unknown>) => {
  let done = false;
  promise.then(
    () => (done = true),
    () => (done = true),
  );
  return () => done;
};

describe("the request (AC-6)", () => {
  it("sends one POST to <url>/calculate, JSON content type, body exactly the validated request", async () => {
    const fetch = answering(200, { result: 3 });

    await client(fetch)({ ...REQUEST, junk: true } as CalculateRequest);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as Parameters<FetchLike>;
    expect(url).toBe("http://calc:3001/calculate");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("content-type")).toBe(
      "application/json",
    );
    expect(JSON.parse(init.body as string)).toStrictEqual({
      operation: "add",
      operands: [1, 2],
    });
  });

  it("joins /calculate onto a base URL that already ends in a slash without doubling it", async () => {
    const fetch = answering(200, { result: 3 });

    await client(fetch, "http://calc:3001/")(REQUEST);

    expect(fetch.mock.calls[0]?.[0]).toBe("http://calc:3001/calculate");
  });
});

describe("a recognisable answer (AC-7)", () => {
  it("yields the downstream's number unchanged for a 200 whose body is a valid result", async () => {
    await expect(
      client(answering(200, { result: 0.30000000000000004 }))(REQUEST),
    ).resolves.toStrictEqual({ kind: "result", result: 0.30000000000000004 });
  });

  it.each(["DIVISION_BY_ZERO", "NEGATIVE_SQRT", "RESULT_NOT_FINITE"] as const)(
    "relays code and message unchanged for a 422 whose envelope carries %s",
    async (code) => {
      const message = ERROR_MESSAGES[code];

      await expect(
        client(answering(422, { error: { code, message } }))(REQUEST),
      ).resolves.toStrictEqual({ kind: "domain-error", code, message });
    },
  );

  it("drops an unrecognised key on an otherwise valid result and still yields the number", async () => {
    await expect(
      client(answering(200, { result: 5, junk: 1 }))(REQUEST),
    ).resolves.toStrictEqual({ kind: "result", result: 5 });
  });

  it("drops an unrecognised key on an otherwise valid envelope and still relays the error", async () => {
    const error = { code: "DIVISION_BY_ZERO", message: "nope", junk: 1 };

    await expect(
      client(answering(422, { error, extra: true }))(REQUEST),
    ).resolves.toStrictEqual({
      kind: "domain-error",
      code: "DIVISION_BY_ZERO",
      message: "nope",
    });
  });
});

describe("every other answer is unreachable (AC-8)", () => {
  const envelope = (code: string) => ({ error: { code, message: "x" } });
  const UNREACHABLE = { kind: "unavailable", reason: "unreachable" };

  it.each([
    ["a 500 carrying INTERNAL_ERROR", 500, envelope("INTERNAL_ERROR")],
    ["a 400 carrying VALIDATION_ERROR", 400, envelope("VALIDATION_ERROR")],
    ["a 503", 503, envelope("SERVICE_UNAVAILABLE")],
    ["a 200 whose result is a string", 200, { result: "3" }],
    ["a 200 with no result field", 200, {}],
    ["a 200 with a null body", 200, null],
    ["a 200 carrying an error envelope", 200, envelope("DIVISION_BY_ZERO")],
    ["a 422 carrying a result", 422, { result: 3 }],
    ["a 422 whose envelope has an unknown code", 422, envelope("NOT_A_CODE")],
    [
      "a 422 whose code is known but not a domain one",
      422,
      envelope("INTERNAL_ERROR"),
    ],
    [
      "a 422 whose message is not a string",
      422,
      { error: { code: "DIVISION_BY_ZERO", message: 1 } },
    ],
  ])("reports %s as unreachable", async (_case, status, body) => {
    await expect(
      client(answering(status, body))(REQUEST),
    ).resolves.toStrictEqual(UNREACHABLE);
  });

  it.each([200, 422])(
    "reports a %i whose body is not JSON as unreachable",
    async (status) => {
      const fetch: FetchLike = async () =>
        new Response("<html>oops</html>", { status });

      await expect(client(fetch)(REQUEST)).resolves.toStrictEqual(UNREACHABLE);
    },
  );
});

describe("one retry on a refused connection (AC-9)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("retries once after about 100 ms and yields the result when the second attempt answers", async () => {
    const fetch = vi
      .fn<FetchLike>()
      .mockRejectedValueOnce(refused())
      .mockResolvedValueOnce(reply(200, { result: 3 }));
    const outcome = client(fetch)(REQUEST);

    await vi.advanceTimersByTimeAsync(99);
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(2);

    await expect(outcome).resolves.toStrictEqual({ kind: "result", result: 3 });
  });

  it("reports two refused attempts as unreachable and never makes a third", async () => {
    const fetch = vi.fn<FetchLike>().mockRejectedValue(refused());
    const outcome = client(fetch)(REQUEST);

    await vi.advanceTimersByTimeAsync(1000);

    await expect(outcome).resolves.toStrictEqual({
      kind: "unavailable",
      reason: "unreachable",
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe("the deadline (AC-10)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reports a downstream that never answers as timed out once the configured deadline elapses, with no retry", async () => {
    const fetch = hanging();
    const outcome = createCalcClient({
      calcServiceUrl: "http://calc:3001",
      timeoutMs: 3000,
      fetch,
    })(REQUEST);
    const isSettled = settled(outcome);

    await vi.advanceTimersByTimeAsync(2999);
    expect(isSettled()).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(isSettled()).toBe(true);

    await expect(outcome).resolves.toStrictEqual({
      kind: "unavailable",
      reason: "timeout",
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("reads a fetch rejected by its own aborted signal as the deadline, not a refusal: timeout, and no retry", async () => {
    const fetch = hangingUntilAborted();
    const outcome = createCalcClient({
      calcServiceUrl: "http://calc:3001",
      timeoutMs: 3000,
      fetch,
    })(REQUEST);

    await vi.advanceTimersByTimeAsync(3000);

    await expect(outcome).resolves.toStrictEqual({
      kind: "unavailable",
      reason: "timeout",
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("hands fetch a signal that is aborted at the deadline, so a real socket is released", async () => {
    const fetch = hanging();
    const outcome = createCalcClient({
      calcServiceUrl: "http://calc:3001",
      timeoutMs: 250,
      fetch,
    })(REQUEST);

    const signal = fetch.mock.calls[0]?.[1].signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(250);
    expect(signal?.aborted).toBe(true);
    await outcome;
  });
});

describe("a refusal already seen beats the deadline (AC-9)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reports unreachable, not timeout, when the deadline expires during the retry pause, and skips the second attempt", async () => {
    const fetch = vi.fn<FetchLike>().mockRejectedValue(refused());
    const outcome = createCalcClient({
      calcServiceUrl: "http://calc:3001",
      timeoutMs: 50,
      fetch,
    })(REQUEST);

    await vi.advanceTimersByTimeAsync(1000);

    await expect(outcome).resolves.toStrictEqual({
      kind: "unavailable",
      reason: "unreachable",
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("reports unreachable when the deadline expires mid-second-attempt, and the whole call still ends at the budget", async () => {
    const fetch = vi
      .fn<FetchLike>()
      .mockRejectedValueOnce(refused())
      .mockImplementationOnce(() => new Promise<Response>(() => {}));
    const outcome = createCalcClient({
      calcServiceUrl: "http://calc:3001",
      timeoutMs: 150,
      fetch,
    })(REQUEST);
    const isSettled = settled(outcome);

    await vi.advanceTimersByTimeAsync(149);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(isSettled()).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(isSettled()).toBe(true);

    await expect(outcome).resolves.toStrictEqual({
      kind: "unavailable",
      reason: "unreachable",
    });
  });
});
