## ADDED Requirements

### Requirement: Shared mock gamification hook
The system SHALL provide a single mock SWR hook `useQueryMyGamificationSwr()` returning the current user's gamification snapshot — `xp`, `level`, `levelProgress` (current XP within level and next-level threshold), `streak` (current count plus the list of active ISO dates for the heatmap), `rank` (leaderboard position and league name), and `badges` (id, name, icon, earned date) — with `{ data, isLoading, error }` shape matching the house SWR pattern. The data MUST be deterministic (identical across renders and surfaces) and consistent with the existing leaderboard mock values (XP 4820, Level 12, Streak 7, Rank 3).

#### Scenario: Deterministic snapshot
- **WHEN** any surface calls `useQueryMyGamificationSwr()`
- **THEN** it receives the same deterministic snapshot (XP 4820, Level 12, Streak 7, Rank 3, badges) on every call
- **AND** no randomness changes values between renders or between surfaces

#### Scenario: Single source across surfaces
- **WHEN** the account dropdown and the profile page are both open in a session
- **THEN** both render identical XP, level, streak, and rank values because both consume this hook and no surface hard-codes gamification numbers

### Requirement: Guest returns no data
The hook SHALL return no data (and not fabricate a snapshot) when no user is logged in, so consuming surfaces can render their guest states.

#### Scenario: Logged out
- **WHEN** the hook is called while the session is unauthenticated
- **THEN** `data` is empty/undefined and consumers fall back to their guest rendering
