# learn-ai-fab

## MODIFIED Requirements

### Requirement: AI assistant FAB is prominent with an animated ring
The lesson AI-assistant floating button SHALL be sized comfortably (not a small icon) and
sit a clear margin from the right viewport edge, and SHALL show an animated conic-gradient
"running LED" ring around its border. The ring SHALL not intercept pointer events and SHALL
be suppressed under reduced-motion. Dragging, the popover (desktop) and the drawer (mobile)
behavior SHALL be unchanged.

#### Scenario: The FAB shows a rotating ring
- **WHEN** a lesson is open and the AI FAB renders (motion allowed)
- **THEN** the button is enlarged, offset from the right edge, and a gradient ring animates around it

#### Scenario: Reduced motion stops the ring
- **WHEN** the viewer prefers reduced motion
- **THEN** the ring does not animate and the button remains usable
