# challenge-paper-multifile-view

## ADDED Requirements

### Requirement: An exam paper of several files is shown in order
The paper surface SHALL render every attached file in the order the author set, showing the ones the
backend marks as viewable inline and collecting the download-only ones into a separate attachments
area with their name and size.

#### Scenario: Pages plus a template
- **WHEN** a challenge carries three page images and one template archive
- **THEN** the three pages SHALL be rendered inline in order
- **AND** the template SHALL appear as a downloadable attachment rather than inline

#### Scenario: Only downloadable files
- **WHEN** every attached file is download-only
- **THEN** no inline viewer SHALL be rendered
- **AND** all files SHALL be listed as attachments

### Requirement: Single-file papers keep their current behaviour
A challenge that reports no attachment list SHALL be presented exactly as before, from its single
paper fields, so a deployment whose backend predates the multi-file change is unaffected.

#### Scenario: Backend without the attachment list
- **WHEN** the challenge reports a paper but no attachment list
- **THEN** that paper SHALL be rendered as it is today

#### Scenario: No paper at all
- **WHEN** the challenge has neither a paper nor attachments
- **THEN** the surface SHALL show its existing empty state

### Requirement: How a file is presented follows the backend's role
Whether a file is shown inline or offered for download SHALL follow the role the backend reports,
and the FE SHALL NOT re-derive that decision from the filename. How a viewable file is then rendered
— picture versus document frame — MAY be decided locally from its media type.

#### Scenario: Backend marks a file download-only
- **WHEN** a file is reported as download-only
- **THEN** it SHALL NOT be embedded inline even if its name suggests a picture
