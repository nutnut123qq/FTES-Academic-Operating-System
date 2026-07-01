## Context
Default on-canon per NIGHT-RUN-QUEUE. Static segments (following/campus/trending) take precedence over [postId], so no route conflict.

## Goals / Non-Goals
**Goals:** post + comments, build green, FE mock.
**Non-Goals:** comment composer, reactions, share.

## Decisions
- Post block + comment rows (avatar + author + time + text).

## Risks / Trade-offs
- Renders inside the community shell (scope tabs show, none active) — acceptable for scaffold. Mock data. Logged.
