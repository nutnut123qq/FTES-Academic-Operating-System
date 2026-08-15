# share-metadata (delta)

## ADDED Requirements

### Requirement: Course and subject pages emit their own share metadata

`/[locale]/courses/[courseId]` and `/[locale]/subjects/[subjectId]` SHALL expose `generateMetadata`
producing title, description, canonical URL with hreflang alternates, and OpenGraph + Twitter card
tags carrying the entity's real cover image. The page body stays a client component; only a thin
server wrapper is added.

The fetch SHALL be memoized per request and SHALL run without a token — server rendering carries no
session — so only the anonymous projection can reach the metadata. Any failure SHALL degrade to the
default site metadata and SHALL NOT prevent the page from rendering.

Description text SHALL be plain: HTML tags and markdown punctuation stripped, whitespace collapsed,
truncated to ~160 characters with an ellipsis.

#### Scenario: Sharing a course link

- **WHEN** a course URL is pasted into a chat app or crawled
- **THEN** the unfurled card shows the course title, a plain-text summary and the course cover image

#### Scenario: Sharing a subject link

- **WHEN** a subject workspace URL is unfurled
- **THEN** the card title reads `CODE — Name` with the name picked for the URL's locale, and the
  image is the subject cover (falling back to its thumbnail)

#### Scenario: Unknown or failing entity

- **WHEN** the slug/code does not resolve, or the request fails
- **THEN** metadata falls back to the site default and the client page still renders its own state

### Requirement: Production builds resolve absolute URLs against the deployed origin

The production environment SHALL define `NEXT_PUBLIC_SITE_URL`. Without it `SEO_CONFIG.siteUrl`
falls back to `http://localhost:3000`, which makes every default `og:url` and `og:image` on the
deployed site point at localhost.

#### Scenario: Canonical URL on the deployed site

- **WHEN** any page renders on the production deployment
- **THEN** its canonical and OpenGraph URLs are absolute against the deployed origin, not localhost
