## Context
Default on-canon layout (no dedicated brainstorm) per NIGHT-RUN-QUEUE.

## Goals / Non-Goals
**Goals:** progress bar + section/lesson list + done state, build green, FE mock.
**Non-Goals:** real lesson player, unlock/gating, resume, certificates.

## Decisions
- Progress = computed done/total/percent in the hook; thin hand-rolled bar (safe, no unknown block API).
- Lesson rows dense/bordered; done state = Chip soft accent (icon-free to avoid icon risk).

## Risks / Trade-offs
- Hand-rolled progress bar + rows; mock data; no navigation to a lesson yet — logged.
