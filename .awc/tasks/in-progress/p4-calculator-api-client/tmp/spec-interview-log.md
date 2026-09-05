# spec-interview-log — p4-calculator-api-client

## 1 — unexpected-response wording
Q: FE-4 names a fourth error kind, "unexpected response" (a reply that doesn't match the gateway's documented shapes — e.g. malformed JSON, a status/code combination outside the domain-error and outage cases). Neither the PRD nor `docs/spec-phases.md` fixes its exact copy, unlike the outage and network-failure messages, which are direct quotes. What should this message say?
A: "Something went wrong — try again."

## 2 — a frontend-side timeout guard
Q: The gateway already promises a reply within its own 3s deadline (502/504). Should the frontend client also carry its own timeout/abort guard against a gateway that hangs past that promise (a bug, or a stalled connection to the gateway itself), surfaced as one of the existing messages — or should it trust the gateway's guarantee and add no timeout of its own, the same way the rest of this system trusts its declared contracts?
A:
