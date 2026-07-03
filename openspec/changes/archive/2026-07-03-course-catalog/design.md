## Context
Default on-canon per NIGHT-RUN-QUEUE. i18n namespaced courseSystem.* to avoid clashing with any legacy keys.

## Goals / Non-Goals
**Goals:** search + level filter + card grid, build green, FE mock.
**Non-Goals:** real catalog data, pagination, enroll.

## Decisions
- Client filter (query + level). Plain flat search input (ponytail: not a HeroUI field block). Cards = Link tiles.

## Risks / Trade-offs
- Plain input instead of house SearchInput; mock data. Logged.
