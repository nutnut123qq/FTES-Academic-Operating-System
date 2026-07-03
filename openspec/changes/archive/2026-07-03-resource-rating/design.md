## Context
Default on-canon per NIGHT-RUN-QUEUE.

## Goals / Non-Goals
**Goals:** star select + composer + list, build green, FE mock.
**Non-Goals:** persist reviews, one-per-user, moderation.

## Decisions
- Stars = text (★/☆) icon-free; new review appended to local state; mock initial list.

## Risks / Trade-offs
- Local-only (no persist); mock. Logged.
