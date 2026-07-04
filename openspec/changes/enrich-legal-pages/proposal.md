## Why

The `/terms` and `/privacy` pages ship placeholder legal copy over a minimal content model (`intro` + numbered sections of paragraphs/bullets). The real FTES legal content is richer — it needs an important-notice callout, a definitions glossary, payment-method cards, a numbered-purpose list, and a company contact block — none of which the current model can express. We replace the placeholder copy with the real FTES text and enrich the content model so that structure renders natively (no markdown).

## What Changes

- Rewrite `content/terms.ts` and `content/privacy.ts` (vi + en) with the real FTES legal copy (Công ty TNHH Giải pháp Công nghệ Giáo dục FTES).
- Extend the `LegalDocument` content model (`content/types.ts`) with new, optional block types a section can carry: `callout` (tone + title + text), `definitions` (term + definition + optional example), `cards` (icon + label + text grid), `steps` (numbered list), `contact` (company + address + phone), plus nested `subsections`.
- Render the new block types in `LegalPage` — Direction A: a single enriched reading column, keeping the existing `PageContainer` + `max-w-3xl` shell. The warning callout reuses `blocks/feedback/Callout`.
- Keep `TERMS_LAST_UPDATED` / `PRIVACY_LAST_UPDATED` and the existing `legal.*` header/i18n keys.

Not breaking: existing `paragraphs`/`items` sections keep rendering unchanged; new fields are optional.

## Capabilities

### New Capabilities
- `legal-pages`: the `/terms` and `/privacy` reading pages — their structured content model (sections carrying paragraphs, bullet lists, callouts, definitions, card grids, numbered steps, a contact block, and nested subsections) and how `LegalPage` renders them natively in a single reading column, per locale.

### Modified Capabilities
<!-- none — no existing legal spec -->

## Impact

- `src/components/features/legal/content/types.ts` — new optional block types on `LegalSection` + supporting interfaces.
- `src/components/features/legal/content/{terms,privacy}.ts` — full content rewrite (vi + en).
- `src/components/features/legal/LegalPage/index.tsx` — render the new block types; reuse `blocks/feedback/Callout`.
- No backend, no new dependency, no route/metadata change. FE-only, static data.
