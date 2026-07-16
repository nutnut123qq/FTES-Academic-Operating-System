# lesson-ai-anchored-panel

## ADDED Requirements

### Requirement: Ask-about-selection opens a panel anchored at the selection
The system SHALL, on desktop (≥ sm), open the AI chat in a fixed-position portal panel (~360px wide, max 70vh) anchored next to the selection rect captured before the selection is cleared: preferred right of the rect, flipping left when the right edge overflows, falling under the rect centered when both sides overflow, with top clamped inside the viewport.

#### Scenario: Highlight mid-article opens chat beside the passage
- **WHEN** a user highlights text in `#lesson-article` and presses "Hỏi AI về đoạn này" on a desktop viewport
- **THEN** a chat panel appears adjacent to the highlighted area (not the corner FAB popover) with the selection banner active

#### Scenario: Near the right edge the panel flips left
- **WHEN** the selection sits close to the right viewport edge
- **THEN** the panel renders on the left side of the rect fully inside the viewport

### Requirement: Mobile keeps the bottom sheet
The system SHALL keep the existing bottom-sheet/drawer behavior for viewports under the sm breakpoint; the anchored panel never renders there.

#### Scenario: Phone user asks about a passage
- **WHEN** the same flow runs at 375px width
- **THEN** the chat opens as the existing bottom surface with the selection banner

### Requirement: Anchored panel dismissal and intent safety
The system SHALL close the anchored panel on Escape, on pointer-down outside the panel, and on a real lesson change (prev-ref tracked — never clearing the selection intent in a mount effect), clearing the stored selection on close.

#### Scenario: Click outside closes and clears
- **WHEN** the user clicks the article outside the open panel
- **THEN** the panel closes and the selection banner state is cleared

#### Scenario: Opening does not eat the intent
- **WHEN** the panel mounts right after the selection intent was stored
- **THEN** the selection is still present in the chat banner (no reset-on-mount)

### Requirement: Corner FAB flow unchanged
The system SHALL keep the corner FAB and its popover for non-selection usage; both surfaces render the same `ContentAiChat` component.

#### Scenario: Manual open without selection
- **WHEN** a user opens the FAB without any selection
- **THEN** the existing popover behavior is exactly as before this change
