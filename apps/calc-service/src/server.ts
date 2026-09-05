import { serve } from "@hono/node-server";

import { app } from "./app.ts";
import { resolvePort } from "./config.ts";

export type RunningServer = {
  /** The port actually bound — the OS's choice when `CALC_SERVICE_PORT` resolves to `0`. */
  port: number;
  /** Stops accepting connections and resolves once the port is released. */
  close: () => Promise<void>;
};

/**
 * Binds the port `env` resolves to and serves the app there. Nothing binds until this
 * is called, so importing the module — or the app — never takes a port.
 */
export const start = (
  env: Readonly<Record<string, string | undefined>>,
): Promise<RunningServer> =>
  new Promise((resolve, reject) => {
    const server = serve(
      { fetch: app.fetch, port: resolvePort(env) },
      (info) => {
        resolve({
          port: info.port,
          close: () =>
            new Promise<void>((done, fail) =>
              server.close((error) => (error ? fail(error) : done())),
            ),
        });
      },
    );
    server.once("error", reject);
  });

// Run directly (`node src/server.ts`) this is the process's entry point; imported, it only exports `start`.
if (import.meta.main) {
  const { port } = await start(process.env);
  console.log(`calc-service listening on port ${port}`);
}
