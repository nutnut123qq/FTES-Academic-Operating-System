# community-comment-sticker-cleanup Specification

## Purpose
Hygiene cleanup after the sticker render feature: remove a temporary verification script and mark the intentional sticker mock comment.

## ADDED Requirements

### Requirement: Remove temporary verification script
The file `scripts/verify-sticker-render.tsx` SHALL be deleted after confirming no other file imports it.

#### Scenario: No orphaned imports
- **GIVEN** a global search for imports of `verify-sticker-render`
- **WHEN** the search returns no results
- **THEN** the file is safe to delete and is removed

### Requirement: Mark intentional sticker mock comment
The mock comment `pc3` in `fetchPostDetailMock` SHALL be kept and SHALL carry an inline comment indicating it is a deliberate sticker render demo.

#### Scenario: Mock comment is labeled
- **GIVEN** the `pc3` mock comment with a sticker token
- **WHEN** a developer reads the file
- **THEN** a `// demo: sticker render` comment appears next to it

### Requirement: No behavior changes
This cleanup SHALL NOT change the sticker render logic, the composer, the parser, or any GraphQL contract.

#### Scenario: Build passes after cleanup
- **WHEN** `npx tsc --noEmit` and `npm run build` run
- **THEN** both complete without errors
