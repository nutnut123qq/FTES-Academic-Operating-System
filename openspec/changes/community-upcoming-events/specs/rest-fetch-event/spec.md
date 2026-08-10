# rest-fetch-event (delta)

## MODIFIED Requirements

### Requirement: Event REST types mirror backend DTOs
The frontend SHALL provide TypeScript interfaces in `src/modules/api/rest/event/types.ts` that match the request/response records defined in `vn.ftes.aos.event.web.dto.EventViews`, including the public `venue` field on `EventView`. Fields the backend may omit SHALL be optional on the frontend type so a surface can degrade instead of rendering `undefined`.

#### Scenario: Type coverage
- **WHEN** a developer imports from `src/modules/api/rest/event`
- **THEN** they can access typed request/response shapes for events, registrations, QR, certificates, and attendance

#### Scenario: Venue on the public event view
- **WHEN** a caller reads an `EventView`
- **THEN** `venue` is available as an optional string, carrying the meeting link for online events and the address for on-site ones
