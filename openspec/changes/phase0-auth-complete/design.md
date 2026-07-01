## Context

Skeleton has Keycloak password + OAuth sign-in via `AuthenticationModal`. No BE endpoints exist
yet for OTP/2FA/reset, so this change is FE-first with mocked async services isolated behind hooks.

## Goals / Non-Goals

**Goals:**
- Complete the FE account lifecycle (register, OTP, 2FA, recovery, remember-me, captcha).
- On-canon (starci-fe-cannon-apply): design-system components, HeroUI, i18n vi/en, house patterns.
- Keep existing sign-in working; build stays green.

**Non-Goals:**
- Real backend endpoints / Keycloak flow wiring (drop-in later).
- SMS provider, email templating, rate-limit backends.

## Decisions

- Mock services in `hooks/auth/*` returning resolved promises with simulated latency; each marked
  `// ponytail: mock BE — wire real endpoint when contract exists`.
- Multi-step flows use local step state in the auth surface; no route changes (modal-driven).
- Captcha reuses `publicEnv().captcha`; when `enabled=false` the gate auto-passes in dev.
- OTP input = 6 single-char cells; cooldown via a countdown hook.

## Risks / Trade-offs

- Mock success paths can mask real error handling — mitigated by modelling error/expiry states in UI now.
- 2FA secret/QR generated client-side for demo only (not secure) — flagged; real secret comes from BE.
