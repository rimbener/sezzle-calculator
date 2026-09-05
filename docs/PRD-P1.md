# PRD — Sezzle Calculator (P1 — Nice-to-Have & Future)

**Author:** Hernán Laura
**Date:** 2026-09-05
**Scope:** Optional improvements (P1) and future ideas (P2). Core scope is in [PRD-P0.md](PRD-P0.md). Build P1 items only after all P0 items are done.

---

## 1. Priority Order

Build in this order; drop what does not fit, do not rush it:

`FE-11 > FE-9 > BE-13 > BE-12 > BE-7 > FE-10 > BE-14 > BE-18 > BE-19`

## 2. User Stories

- **US-9:** As a keyboard user, I want to type digits and operators directly.

## 3. Requirements

### 3.1 Backend (P1)

- **BE-7 — Health endpoints.** Calc-service: `GET /health` → `200 { "status": "ok", "service": "calc-service" }`. Gateway: `GET /api/v1/health` → its own status plus calc-service reachability.
  - *Acceptance (if built):* gateway health returns `"ok"` with calc-service up and `"degraded"` with it down.
- **BE-12 — Request logging** (service, method, path, status, duration) via shared middleware.
- **BE-13 — Configurable timeout.** The 3s default (BE-6) can be changed by env var.
- **BE-14 —** `docker-compose.yml` to start everything with one command.
- **BE-18 — Plain** `GET /health` **on the gateway**, same shape as calc-service's (requires BE-7).
- **BE-19 — 404 in the shared error format** on both services.

### 3.2 Frontend (P1)

- **FE-9 — Keyboard support.** Digits, `+ - * /`, Enter (=), Escape (clear), Backspace. (Basic keyboard operability of all controls is already P0 — FE-12; this adds typed shortcuts.)
- **FE-10 — Session history panel** (in-memory only).
- **FE-11 — Result formatting.** Round floating-point tails for display (`0.30000000000000004` → `0.3`); keep the raw value available on hover/tap.

### 3.3 Future (P2)

- **BE-15 — Expression endpoint** on the gateway, composed of calc-service calls.
- **BE-16 — Rate limiting** at the gateway.
- **BE-17 — Splitting calc-service** (e.g. basic vs. advanced) if it grows; the operation registry should make this simple.

## 4. Use Cases

### UC-9: Health monitoring (only if BE-7 is built)

- **Flow:** `GET :3001/health` → `{ status: "ok", service: "calc-service" }`. `GET :3000/api/v1/health` → gateway status plus calc-service reachability, e.g. `{ status: "degraded", services: { "calc-service": "unreachable" } }`.

## 5. API Contract (P1 additions)

### Public — api-gateway (:3000)

```
GET /api/v1/health     // BE-7
200: { "status": "ok" | "degraded", "services": { "calc-service": "ok" | "unreachable" } }

GET /health            // BE-18, same shape as calc-service's
```

### Internal — calc-service (:3001)

```
GET /health            // BE-7
200: { "status": "ok", "service": "calc-service" }
```

## 6. Phasing

All P1 work is **Phase 5**, after Phases 1–4 in [PRD-P0.md](PRD-P0.md), in the priority order above: result formatting, keyboard support, configurable timeout, request logging, health endpoints (BE-7, BE-18), history panel, docker-compose, 404 format.
