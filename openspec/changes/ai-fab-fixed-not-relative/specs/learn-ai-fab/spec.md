# learn-ai-fab

## MODIFIED Requirements

### Requirement: AI FAB stays pinned to the viewport corner
The AI-assistant FAB SHALL remain `position: fixed` at the bottom-right corner. A decorative
animated-ring utility class SHALL NOT introduce a `position` utility (e.g. `relative`) that
could override the button's `fixed`, since Tailwind emits `.relative` after `.fixed` and it
would win, dropping the button out of the corner.

#### Scenario: FAB visible with the ring
- **WHEN** the AI FAB renders with its animated ring class
- **THEN** it stays fixed at the bottom-right corner and remains visible
