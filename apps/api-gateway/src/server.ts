import { serve } from "@hono/node-server";

import { createApp } from "./app.ts";
import { createCalcClient } from "./calc-client.ts";
import { resolveConfig } from "./config.ts";

export type RunningServer = {
  /** The port bound — the OS's pick when `GATEWAY_PORT` is `0`. */
  port: number;
  /** Stops accepting connections and resolves once the port is released. */
  close: () => Promise<void>;
};

/**
 * Serves the gateway on the port `env` resolves to. The one place production
 * wiring is assembled; importing binds nothing.
 */
export const start = (
  env: Readonly<Record<string, string | undefined>>,
): Promise<RunningServer> =>
  new Promise((resolve, reject) => {
    const { port, calcServiceUrl, timeoutMs, corsOrigin } = resolveConfig(env);
    const app = createApp({
      calcClient: createCalcClient({ calcServiceUrl, timeoutMs }),
      corsOrigin,
    });
    const server = serve({ fetch: app.fetch, port }, (info) => {
      resolve({
        port: info.port,
        close: () =>
          new Promise<void>((done, fail) =>
            server.close((error) => (error ? fail(error) : done())),
          ),
      });
    });
    server.once("error", reject);
  });

// Entry point under `node src/server.ts`; a no-op when imported.
// Tested through real child processes, which no in-process coverage hook can
// see — the suite proves it, the report just cannot attribute it.
/* v8 ignore start */
if (import.meta.main) {
  const { port } = await start(process.env);
  console.log(`api-gateway listening on port ${port}`);
}
/* v8 ignore stop */
