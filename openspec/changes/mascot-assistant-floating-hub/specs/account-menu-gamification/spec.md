# account-menu-gamification (delta)

## MODIFIED Requirements

### Requirement: Account menu popup with level ring and stats
The account menu dropdown SHALL, for a logged-in user, render its header block as the user's avatar wrapped in a level progress ring (ring fill = progress toward the next level, current level number labeled) alongside the user's name and email, followed by the stats row, then the existing menu links (Profile, Saved, Settings), theme switch, and logout — in that order. The popup SHALL NOT carry a discovery ("Khám phá") section: discovery of the AI tools now belongs to the floating mascot assistant, which is present on every page.

#### Scenario: Logged-in popup shows ring, level and stats
- **WHEN** a logged-in user opens the account menu
- **THEN** the popup header shows their avatar inside a level ring labeled with the current level, plus name and email
- **AND** below it a stats row, then menu links (Profile, Saved, Settings), theme switch, and logout in that order
- **AND** no "Khám phá" section appears between them

## REMOVED Requirements

### Requirement: Explore ("Khám phá") shortcuts section in the popup

**Reason**: The section had decayed to a single row — "Trợ lý học tập FrosTES" → `/ai` — after its other three shortcuts (For You, Recommendations, Trending) were folded into Community and the AI hub by earlier changes. A titled section wrapping one row is pure navigation overhead, and it duplicated an AI entry point that the floating mascot already offers on every page.

**Migration**: `/ai` and every `/ai/tools/*` route stay valid and unchanged. They are now reached from the floating mascot assistant's shortcut panel (see the `mascot-assistant` capability), which lists the complete AI roster rather than a single link to the hub. The guest-side variant of the section — which stashed the destination in `AuthReturnTo` and opened the sign-in modal — is removed with it; the mascot panel links straight to the routes, which apply their own auth gates.
