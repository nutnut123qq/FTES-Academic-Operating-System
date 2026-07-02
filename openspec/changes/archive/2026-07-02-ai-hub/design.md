## Layout — catalog archetype, grouped by category (mirrors SubjectCatalog)

The house already decided the catalog shape (title + subtitle + card grid). Reuse it
rather than re-brainstorm; the only §9 twist is sectioning the grid by category:
- `mx-auto max-w-6xl p-6` column; `h4` title + `body-sm muted` subtitle.
- One `<section>` per non-empty category, in a fixed order
  (`student → learning → coding → career → teacher`). Section heading = `body` medium
  in accent text (`className="text-accent"`, since Typography has no `color="accent"`).
- Card grid `sm:grid-cols-2 lg:grid-cols-3`; each card = `rounded-large border
  border-separator p-4`, an accent icon badge (`size-11 rounded-large bg-accent/10
  text-accent`), tool name (`body` medium) + short desc (`body-sm muted`), and a mock
  `Open` Button (`variant="secondary"`, `size="sm"`, `self-start`).

## Data
`useQueryAiToolsSwr` — mock list of ~8 tools `{ id, key, category }`, SWR-shaped so the
BE swap is drop-in. `key` is a stable slug driving the i18n lookup
(`aiPlatform.tools.<key>.{name,desc}`). `ponytail:` note marks the BE swap point.
Categories: student (tutor, planner) · learning (summary, flashcards, quiz) ·
coding (debug) · career (cvReview) · teacher (mentor).

## Icons
Static slug→Phosphor `*Icon` map (confirmed-compiling set), rendered inside the accent
badge; generic `GraduationCapIcon` fallback for unknown keys. `aria-hidden` on the
badge — the tool name carries the label.

## Not doing
- No nav/path wiring (`useAppNav`, `resources/path`) — shared files, deferred.
- No search/filter (8 rows) — add when the hub grows.
- No real tool launch (CTAs are no-ops); no BE.
