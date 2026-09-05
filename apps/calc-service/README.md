# calc-service

The calculation service: the one place the calculator's arithmetic lives. It
owns all seven operations — `add`, `subtract`, `multiply`, `divide`, `power`,
`sqrt`, `percentage` — as pure functions behind an operation registry, and
speaks the request/response contract defined in `@repo/contracts`.

It is an **internal** service. Only the API gateway calls it; it is never
browser-facing, so it serves no CORS headers and the SPA never learns its
address.

Run its tests with:

```sh
npx turbo test --filter=calc-service
```
