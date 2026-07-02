## Why

§23 Integration Hub had no surface — the app can sign in with Google/GitHub and
lean on external providers (AI, storage, payments), but there was no single place to
see which third-party services are connected and which are available to connect.
This ships the hub as a real `200` route at `/integrations` (FE-only mock shell).

## What Changes

- Add `features/integration/IntegrationHub` + `[locale]/integrations/page.tsx`:
  integration cards grouped by category (auth, developer, communication, payment,
  ai, storage), each with an icon badge, service name, category chip, a
  Connected/Not connected status, and a mock connect/disconnect action.
- Add `useQueryIntegrationsSwr` (mock list of ~7 integrations, SWR-shaped).
- Add `integration.*` i18n (en/vi): title/subtitle, statuses, actions, category
  labels, and a per-service label for each integration key.

## Capabilities

### New Capabilities
- `integration-hub`: the connected-services / integrations view at `/integrations`.

### Modified Capabilities
- (none)

## Impact
- FE: new `features/integration/IntegrationHub`, `integrations/page.tsx`,
  `useQueryIntegrationsSwr`, `integration.*` i18n. No BE (mock). No shared-file edits
  (nav/path wiring deferred).
