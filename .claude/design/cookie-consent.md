# design — cookie consent ("cookie allow") banner

## BUILT — Direction A (2026-06-21, tsc+eslint clean, JSON valid)
- **Store** `hooks/zustand/cookieConsent/store.ts` — committed `{ decided: null|false|true, analyticsAllowed }`
  + `hydrate/acceptAll/rejectAll/save`; persists cookie `starci_cookie_consent` (`{v:1, analytics}`, 180d,
  SameSite=Lax). `decided=null` pre-hydration → no flash; cookie written ONLY on affirmative choice.
- **Banner** `features/cookie-consent/CookieConsentBanner` — `StickyBottomBar`, shows while `decided===false`;
  parity buttons [Chấp nhận tất cả primary][Từ chối secondary, same size][Tùy chỉnh tertiary→modal]. Mounted
  in `InnerLayout`.
- **Preferences modal** `modals/CookieConsentModal` — Necessary (Switch on+disabled) + Analytics (Switch,
  draft state seeded on open) + Save/Reject/Accept-all. Overlay key `cookiePreferences`. In `ModalContainer`.
- **AnalyticsGate** `features/cookie-consent/AnalyticsGate` — renders `<GoogleAnalytics>` ONLY when
  `decided && analyticsAllowed`. Replaced the unconditional GA in `[locale]/layout.tsx` → **fixes the
  block-scripts-until-consent gap**.
- i18n `cookieConsent.*` (vi+en). No BE change.
- **Follow-ups (not done):** (1) footer "Cài đặt cookie" link to reopen the modal (withdraw consent) — the
  `useCookiePreferencesOverlayState().open` accessor exists, just needs a footer entry; (2) a real cookie/
  privacy policy page to link from the banner; (3) add the 3 SEO env vars to `.env.example`.

---


New global UI element (not a page redesign). Marketing-facing (shows over the landing). NO existing consent
component in the repo.

## Grounded inventory — what StarCi actually sets (no invented categories)
- **Cần thiết / necessary (luôn bật, không toggle):** Keycloak auth (access token in Redux/localStorage),
  **refresh token HttpOnly cookie**, **CSRF token cookie** (`attach-csrf-token`), **`LOCALE` cookie**
  (`i18n/routing.ts`, scoped `.academy.starci.org`). Strictly necessary / functional.
- **Phân tích / analytics (toggle, default OFF):** **Google Analytics** only — `<GoogleAnalytics gaId>` from
  `@next/third-parties/google` in `app/[locale]/layout.tsx`, gated on `SEO_CONFIG.gaId`.
- **NO marketing/ad pixels** (no fbq/posthog/hotjar/clarity). → categories = **Necessary + Analytics ONLY**.

## ⚠️ Compliance gap to fix (the real reason this matters)
`<GoogleAnalytics>` renders **unconditionally** today → GA loads BEFORE consent. 2026 rule (GDPR + VN PDPD
Nghị định 13/2023): **block scripts until consent**. → must gate the `<GoogleAnalytics>` render on
`analytics === true` (or Google Consent Mode v2 default-denied). + **button parity**: Reject must be as
easy/prominent as Accept (colored-Accept-vs-gray-Reject ruled non-compliant, Austria 2025). + no pre-ticked
analytics (affirmative action).

## Directions
### A · Bottom bar + Tùy chỉnh modal (RECOMMENDED)
- Layer 1: `StickyBottomBar` — short text + **[Chấp nhận tất cả] [Từ chối]** (equal prominence) +
  **Tùy chỉnh** (link) + "Chính sách cookie" link. Non-blocking (landing stays visible).
- "Tùy chỉnh" → overlay-store modal: toggle list — Cần thiết (locked on) + Phân tích (toggle, default OFF) →
  [Lưu lựa chọn].
- Reuses `StickyBottomBar` + the overlay modal pattern; least intrusive for a marketing site; easy
  button-parity. Ref: cookieinformation / secureprivacy 2026 (banner + granular panel).

### B · Blocking centered modal (consent wall)
- Backdrop modal blocking the page until a choice. Guarantees consent-before-tracking, very explicit.
- ❌ hurts landing first-impression; regulators dislike content-blocking walls. Overkill here.

### C · Corner floating card
- Small card bottom-left (Vercel/Linear style) — lighter, modern, not full-width. Same compliance.
- Text must be terse; mobile → bottom sheet. A stylistic variant of A.

## Recommendation
**A** — industry-standard compliant pattern, reuses house blocks, non-blocking for the marketing landing,
trivially button-parity-compliant. (C = lighter aesthetic variant if thầy prefers a corner card; B rejected.)

## Section → storage (client-side; NO new BE)
| Part | Source |
|---|---|
| Consent state | client cookie `starci_cookie_consent` = `{ necessary: true, analytics: bool, ts, version }` |
| Show banner? | no consent cookie (or version bumped) → show |
| GA load | gate `<GoogleAnalytics>` on `analytics === true` |
| Re-open later | footer link "Cài đặt cookie" reopens the Tùy chỉnh modal |
| Categories | Necessary (auth/CSRF/locale) + Analytics (GA) — grounded, no marketing |

(Optional later: a consent-log endpoint for audit trail — defer, don't fake; client cookie is enough for v1.)

## Blocks / wiring
- Banner = `StickyBottomBar` (exists). Modal = overlay store (`useOverlayStore` + a `useCookieConsent*` hook)
  + a new `CookieConsentModal` in `ModalContainer`. A small `useCookieConsent` zustand/hook reads+writes the
  cookie (js-cookie or document.cookie) and exposes `{ analytics, setConsent, openPreferences }`.
- Empty/a11y: focus-trap the modal, ESC closes preferences (NOT the banner — banner needs a choice or stays);
  buttons keyboard-reachable; bar `role="region" aria-label`.
- i18n: `cookieConsent.*` (vi+en) — title/body/acceptAll/reject/customize/save/necessary/analytics/policyLink.
