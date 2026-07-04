## 1. Content model

- [x] 1.1 Add block interfaces to `content/types.ts` (`LegalCallout`, `LegalDefinition`, `LegalCard`, `LegalContact`) and extend `LegalSection` with optional `callout`, `definitions`, `cards`, `steps`, `contact`, `subsections`.

## 2. Renderer

- [x] 2.1 In `LegalPage/index.tsx`, add an `ICONS` record mapping card/contact icon keys → Phosphor components.
- [x] 2.2 Extend `Section` to render callout (`blocks/feedback/Callout`), definitions, cards grid, steps, contact panel, and recurse `subsections` — each `?`-guarded, tokens only, dark-safe.

## 3. Content rewrite

- [x] 3.1 Rewrite `content/terms.ts` (vi + en) with the real FTES Điều Khoản Dịch Vụ; keep/bump `TERMS_LAST_UPDATED`.
- [x] 3.2 Rewrite `content/privacy.ts` (vi + en) with the real FTES Chính Sách Bảo Mật; keep/bump `PRIVACY_LAST_UPDATED`.

## 4. Verify

- [x] 4.1 `tsc --noEmit` clean.
- [x] 4.2 `npm run build` (webpack) green.
- [x] 4.3 Spot-check `/vi/terms`, `/en/terms`, `/vi/privacy`, `/en/privacy` render every block type in light + dark.
