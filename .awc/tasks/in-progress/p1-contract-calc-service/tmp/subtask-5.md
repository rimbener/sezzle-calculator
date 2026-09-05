# subtask-5 — Server entry, port configuration and README

- **slice:** 3 — the HTTP surface
- **criteria:** AC-15, AC-16, AC-19
- **status:** todo
- **paths:** `apps/calc-service/package.json`, `apps/calc-service/src/server.ts`, `apps/calc-service/src/config.ts`, `apps/calc-service/src/config.test.ts`, `apps/calc-service/src/server.test.ts`, `apps/calc-service/README.md`

`config.ts` resolves the port from `CALC_SERVICE_PORT`, defaulting to 3001 when the variable is absent, and is a pure function of an environment object so resolution is testable without starting anything (AC-15).

`server.ts` is the entry point. It exports a `start(env)` that reads the config and hands `app.fetch` to `@hono/node-server`'s `serve`, returning a closable handle. It binds a port only when called, so importing the app or the module never binds one. Being run directly is what calls `start(process.env)`.

That exported `start` makes AC-19 checkable: `server.test.ts` starts the service with `CALC_SERVICE_PORT` set to a free port, issues a real `POST /calculate` against `http://127.0.0.1:<that port>`, asserts the 200, and closes the handle — proving the resolved port is the bound one, not merely computed. The 3001 default stays a `config.test.ts` assertion, since binding it in a test would collide with a running dev server.

The `dev` (`node --watch src/server.ts`) and `start` (`node src/server.ts`) scripts are added to `apps/calc-service/package.json` here, in the subtask that supplies the file they name.

The README (AC-16) extends the one subtask-3 wrote with: the command that starts it; `CALC_SERVICE_PORT` and its 3001 default; a worked `curl` against `POST /calculate` with its 200 response and one error response; and the percentage definition `x% of y` = `(x / 100) * y` (XC-3).
