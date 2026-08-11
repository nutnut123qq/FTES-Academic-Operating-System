# rest-ai-stream

## ADDED Requirements

### Requirement: Streamed AI replies survive either newline convention

The AI session stream reader SHALL treat a blank line as the boundary between two server-sent events,
accepting that blank line written with either LF or CRLF, and SHALL carry a partial trailing boundary
forward in its buffer until a later read completes it.

Within a block, the reader SHALL tolerate a carriage return at the end of each line, so that no
carriage return reaches the text handed to the caller. The newline forms accepted at the block
boundary and the newline forms tolerated per line SHALL be the same set.

#### Scenario: LF stream yields each delta separately

- **WHEN** the server streams two delta events separated by a blank line
- **THEN** the caller receives two separate delta payloads in order

#### Scenario: CRLF stream yields the identical deltas

- **WHEN** an intermediary rewrites the same stream with CRLF newlines
- **THEN** the caller receives the same payloads as the LF stream
- **AND** no payload contains a carriage return

#### Scenario: Boundary split across two reads

- **WHEN** one read ends partway through a boundary and the next supplies the remainder
- **THEN** the completed event is delivered once, and not twice

#### Scenario: Terminal event still parses

- **WHEN** the stream ends with a done event carrying a JSON payload
- **THEN** that payload is parsed and delivered to the done handler
