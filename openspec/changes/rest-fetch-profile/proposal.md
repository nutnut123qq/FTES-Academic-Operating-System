## Why

The shared REST client (`restRequest`) already serves `challenges`, `course`, `subject`, `identity`, `commerce`, `community`, `resource`, `gamification`, and `notification`. The profile domain exposes two REST controllers in `vn.ftes.aos.profile.web` — `MeProfileController` for owner-scoped profile management and `PublicProfileController` for public profile and follow actions — but the frontend currently has no typed REST layer for them. Several core profile reads and writes (current-user summary, public profile by username, update profile, follow/unfollow, followers/following lists) are already covered by existing GraphQL operations; this change focuses on the profile REST surface that GraphQL does not serve: portfolio, privacy settings, social links, self-declared achievements, avatar/cover/assets uploads, profile timeline, and moderation.

## What Changes

- Reuse `src/modules/api/rest/client/` (`restRequest`, envelope unwrap, bearer token) from previous changes.
- Add a typed REST client under `src/modules/api/rest/profile/` covering:
  - `MeProfileController` — privacy, social links, portfolio projects/assets, achievements, avatar/cover uploads.
  - `PublicProfileController` — profile timeline and moderator patch.
- Add `usePost*Swr` mutation hooks for every writing REST endpoint we expose.
- Add `useGet*Swr` query hooks for read endpoints without GraphQL coverage.
- Update `src/modules/api/rest/index.ts` to re-export `./profile`.
- Explicitly document profile endpoints already covered by GraphQL and skip their REST clients.
- No new dependencies; no changes to backend or other modules.

## Capabilities

### New Capabilities
- `rest-fetch-profile`: REST client + SWR wrappers for the profile controller cluster, deduplicated against existing GraphQL.

### Modified Capabilities
- None.

## Impact

- New files in `src/modules/api/rest/profile/` and `src/hooks/swr/api/rest/mutations/` (plus query hooks in `src/hooks/swr/api/rest/queries/`).
- One-line change to `src/modules/api/rest/index.ts`.
- No runtime impact until components import the new hooks.
