# profile-settings-navigation (delta)

## ADDED Requirements

### Requirement: The settings rail groups its destinations and can leave settings

The `/profile/settings/*` shell SHALL present its destinations as LABELLED GROUPS in the rail rather
than one flat list, with a divider before every group after the first. The groups are Account
(profile editor, appearance, security, devices, membership), Learning (course history), FrosTES
(AI settings, AI plan) and Preferences (privacy, notifications).

The rail SHALL list only destinations that already exist — it is navigation, not a menu of
intentions.

A rail row MAY point at a destination OUTSIDE the settings subtree (the profile editor). Such a row
SHALL be modelled with a null segment and SHALL never be marked active, because activating it leaves
this shell.

The shell SHALL render a Back control above the section content. It SHALL step back through history
when there is somewhere to go back to, and otherwise navigate to the profile — a cold entry (deep
link, refresh) has no previous page and a plain history-back would do nothing.

#### Scenario: Reading the rail

- **WHEN** the settings shell renders
- **THEN** rows appear under their group captions, with a divider separating groups

#### Scenario: Active row

- **WHEN** the visitor is on `/profile/settings/privacy`
- **THEN** the Privacy row is marked active and no other row is

#### Scenario: Profile editor row

- **WHEN** the visitor activates the "edit profile" row
- **THEN** they navigate to `/profile/edit` and that row is never shown as an active settings section

#### Scenario: Back from a deep link

- **GIVEN** the visitor opened a settings section directly from a link or refresh
- **WHEN** they press Back
- **THEN** they land on their profile rather than nothing happening
