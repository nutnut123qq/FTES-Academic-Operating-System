# learn-ai-fab

## MODIFIED Requirements

### Requirement: LED ring never covers the mascot
The AI FAB's running LED ring SHALL be implemented with a real CSS masked pseudo-element
(`content-box` + `mask-composite: exclude`) so the ring shows only along the border and the
centre stays transparent, keeping the mascot visible. The colours SHALL run around the border.

#### Scenario: Mascot stays visible under the ring
- **WHEN** the AI FAB renders with the LED ring
- **THEN** the mascot image is fully visible and the ring shows only along the border
