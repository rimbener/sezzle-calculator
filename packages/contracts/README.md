# @repo/contracts

The shared request/response contract between the calculator's services: the
seven operation names and their operand counts, the Zod schemas for a calculate
request and for both replies — `calculateResponseSchema` for the `{ result }`
success shape and `errorResponseSchema` for the `{ error: { code, message } }`
envelope, so a caller parses a reply rather than trusting it — the six error
codes, every error message string, and `STATUS_BY_CODE`, each code's default
HTTP status. Every workspace that speaks the calculate API imports these from
here and declares none of its own.

Consumed as source: `exports` points straight at `src/index.ts`, so there is no
build step and nothing to compile before another workspace can import it.

Run its tests with:

```sh
npx turbo test --filter=@repo/contracts
```

Or re-run them on every save:

```sh
npx turbo test:watch --filter=@repo/contracts
```
