# subject-practice

## ADDED Requirements

### Requirement: Curators can have exam pictures digitised
The album management panel SHALL offer digitising pictures of exam pages into text as an action
separate from adding pictures, SHALL send the pictures one at a time, and SHALL show progress while
they are processed. The interface SHALL state that digitising does not keep the original picture.

#### Scenario: Digitising exam pictures
- **WHEN** a curator picks pictures to digitise
- **THEN** they SHALL be sent one after another
- **AND** progress SHALL be shown while they are processed

#### Scenario: Keeping the two actions apart
- **WHEN** the panel is shown
- **THEN** adding pictures and digitising pictures SHALL be separate controls

### Requirement: Text pages read like a printed exam sheet
The viewer SHALL present a text page on a white sheet carrying the FTES watermark, and the sheet
SHALL remain legible regardless of the reader's colour theme.

#### Scenario: Reading a text page in dark mode
- **WHEN** a reader using the dark theme opens a text page
- **THEN** the page's text SHALL remain readable against the sheet

#### Scenario: The sheet is branded
- **WHEN** a text page is shown
- **THEN** the FTES watermark SHALL be visible behind the text
- **AND** the text SHALL remain selectable
