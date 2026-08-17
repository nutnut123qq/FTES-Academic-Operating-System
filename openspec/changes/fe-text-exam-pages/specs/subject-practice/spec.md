# subject-practice

## ADDED Requirements

### Requirement: Curators can add typed exams to an FE album
The album management panel SHALL offer a way to add exam files typed as text alongside the existing
picture upload, SHALL accept several files in one pick, and SHALL send them one at a time so a
failure names the file it belongs to. Progress SHALL be visible while the run is under way. When the
server refuses a file, or reports that the AI had to guess something, the interface SHALL show that
message rather than discarding it.

#### Scenario: Adding text exam files
- **WHEN** a curator picks several text exam files
- **THEN** the files SHALL be sent one after another
- **AND** progress SHALL be shown while they are processed

#### Scenario: One file refused
- **WHEN** the server refuses one of the picked files
- **THEN** the interface SHALL name that file and the reason
- **AND** the remaining files SHALL still be attempted

#### Scenario: Album has less room than the pick
- **WHEN** the pick contains more files than the album can still hold
- **THEN** the overflow SHALL be reported rather than silently dropped

### Requirement: The exam viewer reads text pages
The viewer SHALL render a text page as formatted prose and SHALL NOT render an image element for
it. Paging, the page counter and the thumbnail strip SHALL behave identically across picture and
text pages. A text page's thumbnail SHALL identify it by its source filename.

#### Scenario: Viewing a text page
- **WHEN** the reader lands on a text page
- **THEN** the exam text SHALL be rendered as formatted prose
- **AND** no picture SHALL be requested for that page

#### Scenario: Paging through a mixed album
- **WHEN** the reader pages forward from a text page
- **THEN** the next page SHALL be shown exactly as it would be from a picture page

#### Scenario: Telling text pages apart
- **WHEN** an album holds more than one text page
- **THEN** each thumbnail SHALL show its source filename
