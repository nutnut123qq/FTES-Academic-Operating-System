# app-shell-navigation (delta)

## MODIFIED Requirements

### Requirement: Discovery shortcuts are not header modules

Discovery shortcuts — global AI hub (`/ai`), "For You" (community For You feed), Recommendations (`/recommendations`), and Trending (community trending) — SHALL NOT appear as header navigation modules. Because the header has NO dropdowns, they SHALL NOT appear in any header sub-menu either. The AI destinations SHALL live in the floating mascot assistant that is mounted on every page (see the `mascot-assistant` capability); the remaining destinations live inside their own section pages. The routes `/ai` and `/recommendations` SHALL remain valid and reachable, so that no route is orphaned by their removal from the header.

#### Scenario: AI and Recommendations absent from the header

- **GIVEN** the amended plain-link header
- **WHEN** the user inspects the header
- **THEN** neither an AI Hub link (`/ai`) nor a Recommendations link (`/recommendations`) appears in the header, and since there are no dropdowns, they cannot appear in any header sub-menu

#### Scenario: Discovery routes remain reachable

- **GIVEN** `/ai` and `/recommendations` are no longer in the header
- **WHEN** the user needs the AI hub or recommendations
- **THEN** both routes stay valid: the AI hub and every AI tool are reachable from the floating mascot assistant's shortcut panel on any page, and `/recommendations` content is reached from the AI hub page it was folded into (and from search)
