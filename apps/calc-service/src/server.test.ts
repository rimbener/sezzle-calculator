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

const postAdd = (port: number) =>
  fetch(`http://127.0.0.1:${port}/calculate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operation: "add", operands: [2, 3] }),
  });

describe("start (AC-19)", () => {
  let running: Awaited<ReturnType<typeof start>> | undefined;
  afterEach(async () => {
    await running?.close();
    running = undefined;
  });

  it("binds the port CALC_SERVICE_PORT resolves to and answers POST /calculate there", async () => {
    const port = await freePort();
    running = await start({ CALC_SERVICE_PORT: String(port) });

    expect(running.port).toBe(port);
    const response = await postAdd(port);
    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ result: 5 });
  });

  it("reports the port actually bound, not the one requested, when the OS picks it", async () => {
    running = await start({ CALC_SERVICE_PORT: "0" });

    expect(running.port).not.toBe(0);
    const response = await postAdd(running.port);
    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ result: 5 });
  });

  it("answers on no other port", async () => {
    const [port, other] = await Promise.all([freePort(), freePort()]);
    running = await start({ CALC_SERVICE_PORT: String(port) });

    await expect(postAdd(other)).rejects.toThrow();
  });

  it("releases the port when stopped", async () => {
    const port = await freePort();
    running = await start({ CALC_SERVICE_PORT: String(port) });
    expect((await postAdd(port)).status).toBe(200);

    await running.close();
    running = undefined;

    await expect(postAdd(port)).rejects.toThrow();
  });
});

describe("node src/server.ts — the entry point (AC-19)", () => {
  let child: ChildProcess | undefined;
  afterEach(() => {
    child?.kill();
    child = undefined;
  });

  it("binds CALC_SERVICE_PORT when run directly, announces it, and releases it on exit", async () => {
    const port = await freePort();
    child = spawn(process.execPath, ["src/server.ts"], {
      cwd: join(import.meta.dirname, ".."),
      env: { ...process.env, CALC_SERVICE_PORT: String(port) },
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
    expect(announced.trim()).toBe(`calc-service listening on port ${port}`);

    const response = await postAdd(port);
    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ result: 5 });

    const exited = new Promise<void>((resolve) =>
      process_.once("exit", () => resolve()),
    );
    process_.kill("SIGTERM");
    await exited;
    child = undefined;

    await expect(postAdd(port)).rejects.toThrow();
  });
});
