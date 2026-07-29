# mindmap-smooth-no-overlap

## ADDED Requirements

### Requirement: Mind-map connectors render as smooth cubic curves that flow along the branch axis
The course mind map SHALL draw every tree connector (root→section, section→lesson, lesson→exercise) as a
smooth CUBIC-bezier curve that flows along the spoke's dominant (left/right) axis, rather than as a
single fixed perpendicular bow. Each connector's two control points SHALL be offset toward the mid-span
of the DOMINANT axis (whichever of the horizontal / vertical distance is larger), each held at its own
endpoint's cross-axis value, so the curve leaves the source and enters the target running parallel to
that axis (the classic flowing S-curve). The curve DIRECTION SHALL be derived from the geometry (the
sign of the source→target delta) so a right-branch connector bends rightward and a left-branch connector
bends leftward. The connector endpoints SHALL remain at the node centres (hidden under the cards) and
connectors SHALL remain rendered UNDER the node cards, so only the flowing arc between two cards is
visible.

#### Scenario: A horizontal-dominant spoke draws a flowing cubic S-curve
- **WHEN** a connector is drawn between a source centre and a target centre whose horizontal distance is
  the larger axis (a left/right branch, with a vertical offset between the two nodes)
- **THEN** the path is a cubic bezier whose two control points are pushed to the horizontal mid-span,
  each kept at its own endpoint's y — so the drawn curve leaves the source and enters the target
  horizontally and visibly sweeps between them, never running as a straight line or a rotational bow

#### Scenario: The curve bends in the branch's own direction
- **WHEN** two connectors are drawn to targets on opposite sides of the root (one to the right, one to
  the left)
- **THEN** the right-branch connector's control points are offset toward the right (positive x) and the
  left-branch connector's toward the left (negative x), because the offset sign is taken from the
  source→target geometry rather than a fixed rotational direction

#### Scenario: Curves stay under the cards with endpoints at node centres
- **WHEN** the canvas renders the nodes and their curved connectors
- **THEN** each connector's endpoints sit at the two node centres and the connector is layered beneath
  the node cards, so only the flowing arc in the gap between two cards shows

### Requirement: Mind-map cards never overlap
The course mind map SHALL lay the tree out so that no two node cards overlap, for any course regardless
of how many sections, lessons, or exercises it has. Every node SHALL have a known footprint
(width × height per level), and the layout SHALL reserve, for each node, a vertical band whose height is
at least the greater of the node's own row slot and the total height of its children's bands, packing
children into disjoint sub-bands. Sibling section cards SHALL branch to the LEFT and RIGHT of the root
(balanced) and stack vertically with a centre-to-centre gap of at least the card height plus a margin. A
section's expanded lessons SHALL form a vertical column just OUTWARD of that section (not radiating into
other branches), and each lesson's exercises SHALL form a further column outward again, each level in its
own horizontal column whose gap clears both cards' half-widths. The left and right branches SHALL be
separated on the horizontal axis so they cannot collide near the root.

#### Scenario: A dense course produces no overlapping cards
- **WHEN** the mind map builds the graph for a course with many sections, many lessons per section, and
  exercises under some lessons, with every section expanded
- **THEN** the axis-aligned bounding box of every placed card (computed from its position and its
  per-level footprint) is disjoint from every other card's bounding box — no two cards intersect

#### Scenario: Sibling sections and their lesson columns keep clear gaps
- **WHEN** two adjacent sections on the same side are both expanded, each with its own vertical lesson
  column
- **THEN** each section owns a vertical band tall enough for its own lesson column, the bands are laid
  end-to-end without overlapping, and neither the section cards nor their lesson columns collide

#### Scenario: Left and right branches do not collide near the root
- **WHEN** sections are placed on both the left and the right of the root
- **THEN** the right-branch column sits far enough to the right and the left-branch column far enough to
  the left that neither branch's cards overlap the root or each other, whatever the vertical placement
