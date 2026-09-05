import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { start } from "./server.ts";

/** A port the OS just handed out and released, so the service can bind it next. */
const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      if (address === null || typeof address === "string") {
        reject(new Error("probe bound no TCP port"));
        return;
      }
      probe.close(() => resolve(address.port));
    });
  });

/**
 * No fakes: the real client and global `fetch`, aimed at a port nothing
 * listens on, so the gateway sees a refused connection — twice, 100 ms apart.
 */
const env = async (port: number) => ({
  GATEWAY_PORT: String(port),
  CALC_SERVICE_URL: `http://127.0.0.1:${await freePort()}`,
  CALC_SERVICE_TIMEOUT_MS: "1000",
});

const post = (port: number, body: string) =>
  fetch(`http://127.0.0.1:${port}/api/v1/calculate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });

const postAdd = (port: number) =>
  post(port, JSON.stringify({ operation: "add", operands: [2, 3] }));

const UNREACHABLE = {
  error: {
    code: "SERVICE_UNAVAILABLE",
    message: "calculation service is unreachable",
  },
};

describe("start (AC-18)", () => {
  let running: Awaited<ReturnType<typeof start>> | undefined;
  afterEach(async () => {
    await running?.close();
    running = undefined;
  });

  it("binds the port GATEWAY_PORT resolves to and answers a malformed body there with 400, no downstream needed", async () => {
    const port = await freePort();
    running = await start(await env(port));

    expect(running.port).toBe(port);
    const response = await post(port, '{"operation": "foo", "operands": []}');
    expect(response.status).toBe(400);
    expect(await response.json()).toStrictEqual({
      error: { code: "VALIDATION_ERROR", message: "unknown operation 'foo'" },
    });
  });

  it("answers a valid body with 502 SERVICE_UNAVAILABLE when CALC_SERVICE_URL points at nothing — the real client and fetch in the path", async () => {
    const port = await freePort();
    running = await start(await env(port));

    const response = await postAdd(port);
    expect(response.status).toBe(502);
    expect(await response.json()).toStrictEqual(UNREACHABLE);
  });

  it("reports the port actually bound, not the one requested, when the OS picks it", async () => {
    running = await start({ ...(await env(0)) });

    expect(running.port).not.toBe(0);
    const response = await post(running.port, "{not json");
    expect(response.status).toBe(400);
  });

  it("answers on no other port", async () => {
    const [port, other] = await Promise.all([freePort(), freePort()]);
    running = await start(await env(port));

    await expect(postAdd(other)).rejects.toThrow();
  });

  it("releases the port when stopped", async () => {
    const port = await freePort();
    running = await start(await env(port));
    expect((await postAdd(port)).status).toBe(502);

    await running.close();
    running = undefined;

    await expect(postAdd(port)).rejects.toThrow();
  });
});

describe("node src/server.ts — the entry point (AC-18)", () => {
  let child: ChildProcess | undefined;
  afterEach(() => {
    child?.kill();
    child = undefined;
  });

  it("binds GATEWAY_PORT when run directly, announces it, and releases it on exit", async () => {
    const port = await freePort();
    child = spawn(process.execPath, ["src/server.ts"], {
      cwd: join(import.meta.dirname, ".."),
      env: { ...process.env, ...(await env(port)) },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const process_ = child;

    const announced = await new Promise<string>((resolve, reject) => {
      let out = "";
      let err = "";
      process_.stdout?.on("data", (chunk: Buffer) => {
        out += chunk.toString();
        if (out.includes("\n")) resolve(out);
      });
      process_.stderr?.on("data", (chunk: Buffer) => (err += chunk.toString()));
      process_.once("exit", (code) =>
        reject(new Error(`exited early with ${code}: ${err}`)),
      );
    });
    expect(announced.trim()).toBe(`api-gateway listening on port ${port}`);

    const response = await postAdd(port);
    expect(response.status).toBe(502);
    expect(await response.json()).toStrictEqual(UNREACHABLE);

    const exited = new Promise<void>((resolve) =>
      process_.once("exit", () => resolve()),
    );
    process_.kill("SIGTERM");
    await exited;
    child = undefined;

    await expect(postAdd(port)).rejects.toThrow();
  });
});
