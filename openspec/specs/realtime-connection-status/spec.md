# realtime-connection-status Specification

## Purpose
TBD - created by archiving change lesson-reader-states-progress. Update Purpose after archive.
## Requirements
### Requirement: Connection banner reflects real drops only
The global realtime connection banner SHALL surface a "reconnecting" state only for a
socket namespace that was previously connected and has since dropped. A namespace that
has never successfully connected (e.g. an optional socket blocked by a WAF or absent in
the current environment) SHALL NOT raise the banner, because the app keeps working over
HTTP and a never-connected optional socket is not a degradation the learner must see.

#### Scenario: Never-connected namespace stays silent
- **WHEN** a socket namespace has never completed a connection (only connect errors or no attempt)
- **THEN** the connection banner is not shown for that namespace

#### Scenario: Previously-connected namespace that drops shows reconnecting
- **WHEN** a socket namespace was connected and then disconnects
- **THEN** the connection banner shows the "reconnecting" state
- **WHEN** that namespace reconnects
- **THEN** the banner clears

