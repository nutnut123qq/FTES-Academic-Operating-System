# Decision — typography / text rendering

When & WHY we choose a text-rendering primitive. A decision log: for a given scenario, which component we
picked and the reasoning — so next time we render text, we reuse the house's logic instead of guessing.
Plain text vs inline-rich vs full-markdown.

**StarCi blocks/reuseables in this family:** `Typography` (HeroUI), `RichText` (reuseable), `MarkdownContent` (reuseable)

> Grows automatically: at the END of each `/starci-fe-ux-apply`, the decision for this family (scenario →
> choice → why) is appended below. No manual command.

## Design baseline — the 3-rung ladder (pick the LIGHTEST that fits)

1. **Plain text → HeroUI `Typography`** (`type="body|body-sm|body-xs|h1..h6|code"`, `color="default|muted"`,
   `weight`). The default for ALL non-formatted copy. Prefer it over `<div>`+text classes (see `../ui/CONTENT.md`).
2. **Short copy with a LITTLE inline formatting → `RichText`** (`components/reuseable/RichText`). A tiny
   inline-markdown renderer: `` `code` `` · `**bold**` · `_italic_` · `[label](url)` · line breaks (`\n`).
   Anything else renders as plain text. Props: `text` (string), `size` (Typography `type`, default `body-sm`),
   `color` (Typography `color`), `className`. Wraps ONE `Typography` so it inherits the house type scale.
   NO block elements (no headings/lists/code-fences/tables). Use for titles, descriptions, captions, chips-adjacent copy.
3. **Full lesson/article markdown → `MarkdownContent`** (`components/reuseable/MarkdownContent`). The HEAVY one:
   `react-markdown` + `remark-gfm`/`remark-directive` + 4 custom directive transformers (`:::muted/tab/chip/accordion`),
   mermaid, code-to-html, the `reading` grade. Block-level. Use ONLY for authored lesson bodies / briefs.

**The rule (thầy chốt):** don't reach for `MarkdownContent` when a string just needs an inline `code` or `**bold**` —
that pulls the whole markdown pipeline (parse + plugins + block renderers) for a one-line label. `RichText` is the
middle rung: inline-only, size + className, cheap. Match the renderer to the content's complexity.

**Inline-code styling = match the house** — `RichText` code spans reuse the MarkdownContent inline-code look
(`rounded-md bg-default px-1.5 py-0.5 font-mono text-accent`) but with `text-[0.9em]` so it scales with the
surrounding `size` instead of a fixed `text-sm`.

## Decisions (newest first)

### 2026-06-21 — New `RichText` reuseable (inline-markdown Typography), wired into the task brief
- **Scenario:** the personal-project task `description` rendered as a plain `<Typography>` — so inline `code`
  (`GET /health`, `200 {"status":"ok"}`) and `**bold**` in the copy showed as literal asterisks/backticks.
  `MarkdownContent` would render it but is "hardcore" (full react-markdown + remark plugins + block elements) —
  overkill for a one-line description. Thầy: "tạo 1 cái rich text Typo … không hardcore như MarkdownContent,
  chỉ nhận element đơn giản, nhận size, nhận className."
- **Chose:** build `reuseable/RichText` — a ~120-line inline-only renderer (earliest-match-wins recursive
  tokenizer over `code`/`bold`/`italic`/`link`/`\n`), wrapped in one `Typography type={size}`. Wired it into
  `PersonalProject` `Task` for the description (`<RichText text={displayTask.description} size="body-sm"
  color="muted" />`). Title stays plain `Typography h3`.
- **WHY:** the missing middle rung of the text ladder (see baseline). Plain `Typography` can't format; full
  `MarkdownContent` is too heavy + renders block elements that break a tight title/desc pair. `RichText` keeps the
  house type scale (via `size`) + merges `className`, renders ONLY inline elements → safe inside a `gap-0`
  title+desc header.
- **Code-canon notes:** presentational reuseable (no data/i18n), `extends WithClassNames<undefined>`, `size`/`color`
  typed off `React.ComponentProps<typeof Typography>` (no fragile named-type import). Exported via the reuseable barrel.
- **Files:** NEW `reuseable/RichText/index.tsx` (+ barrel); `PersonalProject/index.tsx` (description → `RichText`;
  also added the missing `Card`/`CardContent`/`cn` imports for the teacher's in-progress carded 3-tier layout).
- **Verify:** eslint EXIT 0 + `tsc --noEmit` clean. Auth+enrollment-gated route → not browser-verified here.

## Gotchas
- **`RichText` is INLINE-ONLY by design.** If a string needs headings/lists/code-fences/tables/mermaid, that's
  `MarkdownContent`, not `RichText` — don't grow `RichText` into a second markdown engine. Inline code is literal
  (never re-parsed for nested markers); bold/italic/link labels DO re-parse (so `**a `b`**` nests).
