# @repo/contracts

The shared request/response contract between the calculator's services: the
seven operation names and their operand counts, the Zod schema for a calculate
request, the `{ result }` success shape, the `{ error: { code, message } }`
error envelope, the error codes and every error message string. Every workspace
that speaks the calculate API imports these from here and declares none of its
own.

Consumed as source: `exports` points straight at `src/index.ts`, so there is no
build step and nothing to compile before another workspace can import it.

Run its tests with:

```sh
npx turbo test --filter=@repo/contracts
```
