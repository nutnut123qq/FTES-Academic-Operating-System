# profile-privacy-settings (delta)

## ADDED Requirements

### Requirement: Privacy settings screen controls profile visibility and per-field exposure

`/profile/settings/privacy` SHALL let the viewer choose WHO can open their profile and WHICH fields
are exposed on it.

Visibility SHALL offer exactly the three values the backend branches on — `PUBLIC`, `MEMBERS`,
`PRIVATE`. No fourth option SHALL be offered: anything else is treated as public server-side, so an
extra choice would be a control that does not mean what it says. The default shown when the account
has never saved privacy settings SHALL match the backend default (`PUBLIC`).

Per-field exposure SHALL be seven switches: `showEmail`, `showPhone`, `showGpa`, `showAcademic`,
`showProgress`, `showTimeline`, `showFollowers`.

The screen SHALL read the self profile through the SHARED self-profile SWR key (so it cannot disagree
with the rest of the profile surfaces) and SHALL write through the existing privacy-settings mutation.
The visibility picker SHALL use the same roving-focus radiogroup keyboard behaviour as the other
settings sections. Loading, error and retry SHALL be handled by the shared async content wrapper.

All labels and hints SHALL come from the i18n message files in both `en` and `vi`.

#### Scenario: Restricting the profile

- **WHEN** the viewer selects `PRIVATE`
- **THEN** the choice is saved through the privacy mutation and the shared self-profile cache reflects it

#### Scenario: Hiding a single field

- **WHEN** the viewer switches off "show email"
- **THEN** only that flag is changed and the visibility choice is untouched

#### Scenario: Keyboard use

- **WHEN** the viewer moves through the visibility options with arrow keys
- **THEN** focus roves within the group exactly as it does in the appearance pickers

#### Scenario: Read fails

- **WHEN** the self profile cannot be read
- **THEN** the section shows the shared error state with a retry, not an empty form that would save
  wrong values
