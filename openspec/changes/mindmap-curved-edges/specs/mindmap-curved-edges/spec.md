# mindmap-curved-edges

## ADDED Requirements

### Requirement: Mind-map connectors render as curved paths
The course mind map SHALL render every tree connector (root→section, section→lesson, lesson→exercise)
as a CURVED path rather than a straight centre-to-centre spoke. Each connector SHALL be a
quadratic-bezier arc that bows away from the straight line between the two node centres — its control
point at the spoke's midpoint, offset PERPENDICULAR to the line by an amount that scales with the spoke
length (capped) — so the connectors read as gentle, consistently-bent curves regardless of the radial
direction the branch fans out. The connector endpoints SHALL stay at the node centres (hidden under the
cards, as before), and connectors SHALL remain rendered UNDER the node cards so only the arc between two
cards is visible. Everything else from the radial / progressive-disclosure design (radial positions,
expand/collapse, click-a-lesson-to-learn, node descriptions) SHALL be unchanged.

#### Scenario: Every connector is a curved edge, not a straight spoke
- **WHEN** the mind map builds the graph for a course
- **THEN** every edge carries the custom curved edge type (a bowed bezier), and no edge is left as the
  straight `"straight"` type

#### Scenario: The curve bows perpendicular to the spoke
- **WHEN** a connector is drawn between a source centre and a target centre
- **THEN** its path is a quadratic bezier whose control point is pushed off the straight line (offset
  perpendicular to the source→target direction), so the drawn connector visibly bends rather than
  running straight

#### Scenario: Curves stay under the cards with endpoints at node centres
- **WHEN** the canvas renders the nodes and their curved connectors
- **THEN** each connector's endpoints sit at the two node centres and the connector is layered beneath
  the node cards, so only the bowed arc in the gap between two cards shows
