import { serve } from "@hono/node-server";

import { app } from "./app.ts";
import { resolvePort } from "./config.ts";

export type RunningServer = {
  /** The port bound — the OS's pick when `CALC_SERVICE_PORT` is `0`. */
  port: number;
  /** Stops accepting connections and resolves once the port is released. */
  close: () => Promise<void>;
};

/** Serves the app on the port `env` resolves to. Importing binds nothing. */
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

// Entry point under `node src/server.ts`; a no-op when imported.
// Tested through real child processes, which no in-process coverage hook can
// see — the suite proves it, the report just cannot attribute it.
/* v8 ignore start */
if (import.meta.main) {
  const { port } = await start(process.env);
  console.log(`calc-service listening on port ${port}`);
}
/* v8 ignore stop */
