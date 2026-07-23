# featured-slider-live

## ADDED Requirements

### Requirement: Course slider renders real banners
The frontend SHALL populate the course-catalog `FeaturedSlider` from
`GET /admin-content/banners?placement=courses`, rendering each banner's title, subtitle
(pitch), CTA label, and background theme, and SHALL use mock rows only when the request
fails — not when it merely returns empty.

#### Scenario: Real banners drive the slider
- **WHEN** the banner endpoint returns banners for placement `courses`
- **THEN** the slider shows those banners with their `subtitle`, `ctaText`, and `theme`
- **AND** no mock row is displayed

#### Scenario: API error falls back to mock
- **WHEN** the banner request errors
- **THEN** the slider falls back to mock rows so the page still renders

#### Scenario: Empty result shows no mock
- **WHEN** the banner request succeeds with an empty list
- **THEN** the slider renders its empty/hidden state rather than mock rows

### Requirement: Slide degrades on missing fields
The frontend SHALL render a slide even when optional banner fields are absent, using a
default CTA label and omitting the pitch or theme rather than breaking layout.

#### Scenario: Banner without cta or theme
- **WHEN** a banner has no `ctaText` and no `theme`
- **THEN** the slide shows a default CTA label and a neutral background, still linking via `linkUrl`
