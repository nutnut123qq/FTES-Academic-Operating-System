# course-mind-map

## MODIFIED Requirements

### Requirement: Mind-map connectors terminate at the card border
Each mind-map connector SHALL terminate at the border of the node it points to (on the
side facing the other node), not at the node's hidden centre, so the connector reaches the
card edge and never draws through the card body. The endpoint SHALL be derived from the
node's measured size; before the node is measured the connector MAY fall back to the centre.

#### Scenario: Connector stops at the target card's edge
- **WHEN** an edge is drawn between two mind-map cards whose sizes are measured
- **THEN** the drawn path ends at the border of each card facing the other, not inside it

#### Scenario: Unmeasured node falls back to centre
- **WHEN** a node has not yet been measured (first paint)
- **THEN** the connector anchors at the node centre and re-snaps to the border once measured
