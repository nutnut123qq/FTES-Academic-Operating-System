## ADDED Requirements

### Requirement: Wordmark renders the supplied logo asset
The `Logo` block SHALL render the brand from `public/logo/FTES_original.svg` as an image with accessible name "FTES AOS", sized by the caller's className (default `h-8 w-auto`). `BrandLogo` continues to wrap it, so the authenticated navbar, footer, and app splash show the logo.

#### Scenario: Logo shown in navbar/footer/splash
- **WHEN** `BrandLogo` renders on any of the authenticated navbar, footer, or app splash
- **THEN** the FTES logo image is shown with accessible name "FTES AOS" and width following the intrinsic ratio at the given height

### Requirement: Public navbar uses the wordmark
The public (shell) navbar SHALL render `BrandLogo` (the FTES wordmark) as the home link, not the "S" `LogoMark`.

#### Scenario: Public navbar brand press
- **WHEN** a user on a public page presses the navbar brand
- **THEN** the FTES wordmark is shown and pressing it routes to the localized home

### Requirement: Favicon and social image use the FTES logo
The favicon (`src/app/icon.svg`) SHALL be the FTES logo, and the social/OpenGraph image SHALL reference an FTES logo asset (`public/logo/FTES_original.png`).

#### Scenario: Browser tab icon
- **WHEN** a page loads in a browser that reads `icon.svg`
- **THEN** the tab icon is the FTES logo (no StarCi mark)
