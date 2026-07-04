## Context

Legal pages are FE-only, static, per-locale content rendered by the shared `LegalPage` feature from `content/{terms,privacy}.ts`. Direction A (chosen): single enriched reading column, existing shell untouched. We only grow the content model and the renderer.

## Model (`content/types.ts`)

Add optional block interfaces and hang them off `LegalSection`:

```ts
type LegalCalloutTone = "warning" | "accent" | "default"
interface LegalCallout { tone?: LegalCalloutTone; title: string; text: string }
interface LegalDefinition { term: string; definition: string; example?: string }
interface LegalCard { icon?: string; label: string; text: string } // icon = phosphor name key
interface LegalContact { company: string; address: string; phone: string }

interface LegalSection {
  heading: string
  paragraphs?: string[]
  items?: LegalListItem[]
  callout?: LegalCallout
  definitions?: LegalDefinition[]
  cards?: LegalCard[]
  steps?: string[]
  contact?: LegalContact
  subsections?: LegalSection[] // recursive, one level used in practice
}
```

`icon` is a small string key mapped to a Phosphor icon in `LegalPage` (keeps the content files free of JSX/imports). Fallback: no icon → render label only.

## Renderer (`LegalPage/index.tsx`)

`Section` grows to render, in order: heading → paragraphs → items → callout → definitions → cards → steps → contact → subsections (recurse `Section` with a smaller heading). Blocks are independent `?`-guards, so a section shows only what it declares.

- **callout** → `blocks/feedback/Callout` (`status="warning"` for tone `warning`), title + description.
- **definitions** → term-anchored list: `font-semibold` term, muted definition, example on its own italic muted line when present.
- **cards** → `grid gap-3 sm:grid-cols-2` (rights/info) — payment/rights use `sm:grid-cols-3`; each a bordered `rounded-2xl border border-default p-4` panel (house rule: padded content box = `rounded-2xl`), icon `size-5` accent, label `text-base font-semibold`, text muted. A tiny `ICONS` record maps `icon` keys → Phosphor components.
- **steps** → `<ol>` rows, each a `size-6 rounded-full bg-accent/10 text-accent` number badge + muted text.
- **contact** → bordered `rounded-2xl border border-default p-4` panel: company semibold, address + phone muted rows with `MapPin`/`Phone` icons.
- **subsections** → recurse `Section` at `level={5}` for the nested heading; used for "thay đổi thông tin đã đăng ký", "Lưu ý quan trọng", payment notes, etc.

Spacing per house: section = `flex flex-col gap-3`; between sections `gap-8` (current) kept. Tokens only, dark-safe, no hardcoded hex.

## Content (`content/{terms,privacy}.ts`)

Transcribe the user's real copy into the model, vi + en. Terms sections: Khái niệm (definitions), Dịch vụ/thông tin, Quyền lợi & trách nhiệm (two card/paragraph groups via subsections), Tài khoản & bảo mật (callout + subsection), Giá & thanh toán (cards + notes subsection), Miễn trừ, Khiếu nại, Hiệu lực, Liên hệ (contact). Privacy sections 1–8 + info cards (§2), steps (§3), retention highlight, rights cards (§7), contact. Keep `*_LAST_UPDATED`; bump to reflect this edit.

## Decisions / trade-offs

- **No new dependency, no jump-nav** — Direction A. Reuse `Callout`; everything else is flat Typography + tokens.
- **Icon-by-key, not JSX in content** — content files stay pure data (current pattern); renderer owns the icon map. Small closed set, YAGNI on a generic registry.
- **`subsections` recursion capped at one level in practice** — the type is recursive for simplicity but content uses depth 1; no deep-nesting UI needed.

## Verify

`npm run build` (webpack) green + `tsc --noEmit` clean. Spot-check `/vi/terms`, `/en/terms`, `/vi/privacy`, `/en/privacy` render all block types in both themes.
