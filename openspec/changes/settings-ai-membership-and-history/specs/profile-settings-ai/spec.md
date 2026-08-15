# profile-settings-ai (delta)

## ADDED Requirements

### Requirement: AI settings screen picks a lane and manages the BYOK key

`/profile/settings/ai-settings` SHALL let the viewer pick one of three AI lanes — auto, premium and
BYOK ("bring your own key") — using the same roving-focus radiogroup keyboard behaviour as the rest
of settings. A lane the account is not entitled to SHALL be disabled according to the entitlement
flags the server returns (`canPremium`, `canByok`), not hidden and not silently ignored.

The BYOK card SHALL let the viewer choose a provider (Gemini or OpenAI) and enter an API key in a
password field. The screen SHALL NOT attempt to display the stored key: the API never returns it,
only its last four characters. A "remove key" action SHALL clear the stored key and provider.

Loading, error and retry SHALL use the shared async content wrapper.

#### Scenario: Switching to a lane the account may not use

- **WHEN** the server reports the account cannot use the premium lane
- **THEN** that lane is rendered disabled and cannot be selected

#### Scenario: Viewing a stored key

- **GIVEN** a key is already stored server-side
- **WHEN** the BYOK card renders
- **THEN** it shows only the last four characters, never the key itself

### Requirement: A blank BYOK key is only accepted when the stored key still applies

Building the update request SHALL refuse a BYOK submission whose key field is blank UNLESS a key is
already stored server-side AND the selected provider is unchanged.

The reason is that a key is stored AGAINST a provider. Switching Gemini → OpenAI without typing a new
key would leave the account pointing at a provider whose key does not exist, and every AI call would
then fail on a lane the viewer believes they configured. When the request is refused, the form SHALL
say a key is required rather than silently saving a broken configuration.

A typed key SHALL always be sent together with its provider (the backend requires the pair). A
non-BYOK lane SHALL send the lane alone, leaving any stored key intact for a later switch back —
clearing is a separate, explicit action.

This decision SHALL live in a pure module with its own tests, separate from the component.

#### Scenario: Same provider, blank field, key on file

- **GIVEN** a Gemini key is stored and the form still shows Gemini
- **WHEN** the viewer saves with the key field blank
- **THEN** the request is accepted and sends the lane only

#### Scenario: Provider changed, blank field

- **GIVEN** a Gemini key is stored
- **WHEN** the viewer switches to OpenAI and saves with the key field blank
- **THEN** the request is refused and the form asks for a key

#### Scenario: No key on file

- **GIVEN** no key is stored
- **WHEN** the viewer saves the BYOK lane with a blank key field
- **THEN** the request is refused

#### Scenario: Leaving BYOK

- **WHEN** the viewer switches to the auto lane
- **THEN** only the lane is sent and the stored key is left untouched
