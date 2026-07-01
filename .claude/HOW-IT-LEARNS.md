# How these skills self-learn

The whole point: **force the AI to get better over time** at designing StarCi's FE — by recording the
DECISIONS the teacher makes (and why) into the **journals**, and reading them back next time. One short loop.

## The house knowledge (it GROWS)
| Store | Holds | Filled from |
|---|---|---|
| **`decision/<block>.md`** | **decision logs** — *why a scenario chose & shaped a block* (card, sidebar, tabs…) | the teacher's design feedback |
| **`design/`** | **page-level UX** — layout/flow decisions (`<page>.md`) + UX lessons (`CONTENT.md`) | apply decisions + live web search |
| **`ui/CONTENT.md`** | the **visual system** — tokens, color, spacing, typography | the design system |
| **`cannon/CONTENT.md`** | FE **code rules** | scanning real `src/` |

## The loop (no separate merge command)
```
1. /starci-fe-ux-brainstorm   read decision + design + cannon  +  SEARCH THE WEB
                              → propose 1–3 layouts + widget mockups
        │  teacher picks one + gives FEEDBACK
        ▼
2. /starci-fe-ux-apply        build it on-canon
                              → at the END of the task, AUTOMATICALLY write the decisions:
                                "scenario → chose block → WHY" into decision/<block>.md,
                                page UX into design/, code rules into cannon/   ← the learning
        ▼
3. next brainstorm reads the now-richer journals → the skill is smarter
```

- **Web search** is in step 1 (UX fetched live, never stale).
- **"Record experience when the teacher feedbacks"** is step 2 — `apply` writes the decision + its reasoning
  into the journals itself, at the end of the task. **The teacher never runs a merge command.**
- **"Self-improve"** = the journals grew, so the next brainstorm reuses the house's logic instead of guessing.

## The other two skills (code side, same knowledge)
- **`/starci-fe-cannon-audit`** — check existing code against `cannon/CONTENT.md`, report drift.
- **`/starci-fe-cannon-apply`** — write new code already on-canon.

## Publish
Edit the skills/knowledge in the FE source `.claude/`, then `pwsh .claude/sync-skills.ps1 "msg"` pushes the
new version to this repo so anyone can `/plugin install`. The knowledge is just `journals/` + `cannon/`, and
the **journals only ever get richer.**
