## ADDED Requirements

### Requirement: Reader adapts to lesson content type
The lesson reader SHALL adapt its body layout to the lesson's content shape rather than always
drawing a reading card: a link-only lesson renders resource cards, a video-only lesson renders
no empty reading card, and written lessons render as before. The content-map SHALL omit sections
that contain no lessons.

#### Scenario: Link-only lesson renders resource cards
- **WHEN** a lesson body is essentially just external link(s)
- **THEN** each link is shown as a resource card (source + an open action that opens a new tab), not raw link text
- **AND** the "ask AI about a passage" hint is not shown

#### Scenario: Video-only lesson has no empty reading card
- **WHEN** a lesson has a video and no written body or documents
- **THEN** no empty reading card is shown — the player is followed directly by the reaction bar

#### Scenario: Written lesson unchanged
- **WHEN** a lesson has markdown or HTML body text
- **THEN** it renders in the reading card with the selection hint and reaction bar as before

#### Scenario: Empty section hidden
- **WHEN** a course section contains no lessons
- **THEN** the content-map rail does not list that section
