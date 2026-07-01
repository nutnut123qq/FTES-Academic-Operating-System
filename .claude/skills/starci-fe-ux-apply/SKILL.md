---
name: starci-fe-ux-apply
description: >
  Build the layout the user chose from /starci-fe-ux-brainstorm into the FE source (ON-CANON) AND record the
  decisions into the journals so the skill self-learns. Step 2 (final) of the loop. Implements the
  page/components per the FE code canon, proposes any MINOR backend delta separately, then — automatically at
  the END of the task — writes each decision into the house memory: component choice/shape (scenario → why) →
  `decision/<block>.md`, page-level UX → `design/<page>.md` + UX lessons → `design/CONTENT.md`,
  code conventions → `cannon/CONTENT.md`. No separate merge command. Use when the user says
  "/starci-fe-ux-apply", "chốt layout này", "apply layout", "build hướng này", "dựng cái này". MAX effort.
---

# /starci-fe-ux-apply — build the chosen layout + record the decisions (the skill learns here)

Step 2 (and final) of the loop. `<src>` = the FE app (`D:/Repositories/starci-academy`); skill paths
`../../cannon`, `../../decision`, `../../design`, `../../ui`.

## 1. Build it ON-CANON
Implement the chosen layout — sections, components, states — in `<src>/src`. **Defer every code decision to
the canon**: read `../../cannon/CONTENT.md` and follow it — blocks props-only · features data-owner ·
`AsyncContent` · tokens + 3-tier + accent teal `#00a898` · HeroUI v3 compound · SWR/Redux/zustand/RHF per the
decision tree. Reuse existing blocks; build a NEW block to the canon's contract if the brainstorm proposed
one. Empty/loading/error + a11y + dark mode are part of "done". Keep the diff scoped; run `npm run lint` /
tsc before calling it done.

## 2. ⚙️ Minor backend delta — propose, don't sneak
If the layout needs data the BE doesn't expose, surface the small delta (GraphQL field / thin query /
projection tweak) as a clear separate proposal for the backend repo. Never silently edit the BE. If the data
isn't there yet, build behind a guard / graceful empty state.

## 3. Record the decisions — AUTOMATICALLY, at the END of the task (this is how the skill learns)
When the work is done, **without being asked**, write down what was decided so the next brainstorm reuses the
logic. Pick the home and add a tight, dated entry:

| The decision is about… | Append to | Section |
|---|---|---|
| **WHY a scenario chose/shaped a block** (the card variant, sidebar density, chip color…) | `../../decision/<block>.md` | "Decisions (newest first)" — *scenario · chose what · WHY · page · date* |
| a **page-level** layout/flow decision | `../../design/<page>.md` | the archetype chosen, section order, why |
| a reusable **UX pattern** lesson (the web ref that won) | `../../design/CONTENT.md` | "Accumulated lessons" |
| a **code** convention discovered while building | `../../cannon/CONTENT.md` | the right SLICE (+ Appendix A ledger) |

Keep entries grounded (cite a real `src/...` path). This is mandatory — the skill only gets smarter if the
decision is written down.

## 4. Close out
Summarize: what was built, the section→data mapping shipped, the BE delta awaiting approval, and which
journal entries you added. Then publish with `.claude/sync-skills.ps1 "msg"` (or note it for the user) — so
everyone's next brainstorm is smarter.
