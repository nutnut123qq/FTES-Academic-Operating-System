# padding — `p-* / px-* / py-*`

Grounded from `src/**.tsx` (2026-06-21): `p-3` ×116 · card `px-4 py-3` (43 + 32) · `p-6` ×29 · `p-0` ×31.
Allowed scale: **`0 · 2 · 3 · 4 · 6`** (same grid as gap). Off-scale (`p-1`, `p-5`, `p-8`, `py-0.5/1/1.5`) → snap.

## Where which padding
| Surface | Padding | Note |
|---|---|---|
| **Card** | **`p-4`** | the current house standard (2026-06-21). Legacy `px-4 py-3` → **migrate to `p-4`**. Don't re-pad a card on top of this. |
| **Rail / panel / content block** | `p-6` | the roomy container |
| **Each part of a content column** | **`p-6`** | a content column is split into parts; **every part = `p-6` + its own `max-w` cap** (2026-06-21) |
| **Parts separated by a `border`/`Divider`** | **`p-6`** | the line does the separating → inner content stays `p-6` |
| **Page shell** (outer frame) | `p-3` | |
| **Drawer / dialog body, list reset** | `p-0` | reset then pad inner wrapper (`p-3`) |
| **Tighter inner (chip, badge, dense row)** | `px-2 py-1` … keep on scale | |

## Rules
- **The BLOCK owns its padding; a feature never sets `p-*`** (cannon SLICE 7). A feature with `p-*` = push it
  into the block or a layout wrapper.
- Horizontal vs vertical split is fine (`px-4 py-3`) but each side stays on the `0/2/3/4/6` scale.
- Section padding = `p-6` (matches the `gap-6` between sections — see `gap.md`).
- Don't stack padding (a `p-6` rail containing a card → the card keeps its own `px-4 py-3`, no extra wrapper pad).

## DON'T (off-scale → snap)
`p-1`/`p-5`/`p-8`/`py-0.5`/`py-1.5` → nearest of `0/2/3/4/6`. Re-padding a card. Feature carrying `p-*`.

## VIOLATION
padding not in `{0,2,3,4,6}` per side; a card with extra `p-*`; a feature (not a block) setting `p-*`.
