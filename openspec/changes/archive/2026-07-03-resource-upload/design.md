## Context
Default on-canon per NIGHT-RUN-QUEUE. Form (no SWR query hook needed).

## Goals / Non-Goals
**Goals:** dropzone placeholder + fields + submit, build green.
**Non-Goals:** real file upload, validation beyond required, versioning.

## Decisions
- Plain flat inputs + native select (safe); submit disabled until required filled; no-op submit.

## Risks / Trade-offs
- Static dropzone, no upload wiring. Logged.
