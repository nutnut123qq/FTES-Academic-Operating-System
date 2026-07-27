## ADDED Requirements

### Requirement: Quests is reached from the account menu, not the primary nav
The primary header/mobile navigation SHALL NOT expose a "Nhiệm vụ" (quests) module; the quest board is reached from the signed-in account (avatar) popup instead. The account popup SHALL offer a "Nhiệm vụ" item that routes to the localized `/quests` route.

#### Scenario: Quests absent from the header
- **WHEN** a user views the primary navigation (desktop header or mobile drawer)
- **THEN** the modules shown are Home, Workplace, Course, Community, Blog — with no Quests module

#### Scenario: Quests reached from the account popup
- **WHEN** a signed-in user opens the account (avatar) popup and presses "Nhiệm vụ"
- **THEN** the popup closes and the app routes to the localized `/quests` route

### Requirement: Account Settings renders standalone, outside the profile shell
The Settings subtree (`/profile/settings/*`) SHALL render as a standalone account page — a plain centered container — and MUST NOT be wrapped in the profile identity + section-tabs shell. All other `/profile` segments SHALL keep the profile shell.

#### Scenario: Settings without the profile frame
- **WHEN** a user opens `/profile/settings` (or any of its sub-pages)
- **THEN** the page renders in its own centered container without the profile identity header or the profile section tabs

#### Scenario: Other profile sections keep the shell
- **WHEN** a user opens a non-settings profile segment (e.g. `/profile`, `/profile/academic`, `/profile/cv`)
- **THEN** the profile identity header and section tabs (the profile shell) are shown as before
