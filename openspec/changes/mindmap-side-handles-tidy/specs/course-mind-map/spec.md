# course-mind-map

## MODIFIED Requirements

### Requirement: Mind-map connectors enter and leave cards on their side edges
Each mind-map connector SHALL attach to a card's SIDE handle (left or right) chosen by the
branch direction — a right-branch link runs from the parent's right edge to the child's left
edge, a left-branch link from the parent's left edge to the child's right edge — and SHALL be
drawn as a smooth bezier that enters and leaves each card horizontally, flush against that side
edge. The connector SHALL neither draw through the card body nor stop short of it, on either
branch side.

#### Scenario: Right-branch connector meets both cards on facing side edges
- **WHEN** a section on the right branch links to its lesson (further right)
- **THEN** the connector leaves the section's right edge and enters the lesson's left edge, flush to each

#### Scenario: Left-branch connector mirrors on the opposite edges
- **WHEN** a section on the left branch links to its lesson (further left)
- **THEN** the connector leaves the section's left edge and enters the lesson's right edge, flush to each
