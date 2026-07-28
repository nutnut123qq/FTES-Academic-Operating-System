# hls-fullscreen-and-datauri-image

## ADDED Requirements

### Requirement: Self-hosted HLS player uses the browser's native fullscreen
The self-hosted HLS lesson player SHALL rely on the native `<video controls>` fullscreen button and SHALL NOT render the custom `LessonFullscreenButton` overlay nor suppress the native control with `controlsList="nofullscreen"`. The custom container-fullscreen overlay SHALL remain in use only on the YouTube-embed player, whose own iframe fullscreen is disabled (`playerVars.fs=0`), so no player shows two competing fullscreen controls.

#### Scenario: Self-hosted player shows only the native fullscreen control
- **WHEN** a lesson plays through the self-hosted HLS player (`<video>` element)
- **THEN** the player exposes the browser's native controls including its native fullscreen button
- **AND** no custom overlay fullscreen button is rendered over the video
- **AND** `controlsList="nofullscreen"` is not applied

#### Scenario: YouTube player keeps the custom container-fullscreen overlay
- **WHEN** a lesson plays through the YouTube-embed player (its iframe native fullscreen disabled)
- **THEN** the custom `LessonFullscreenButton` overlay is rendered
- **AND** pressing it enters or exits container fullscreen so the AI FAB stays visible

### Requirement: Embedded base64 data-image URIs render as images
MarkdownContent SHALL render an embedded image whose source is a base64 data URI of an allowed image mime type (`data:image/png`, `jpeg`, `jpg`, `gif`, `webp`, or `svg+xml`) as an `<img>` with the data URI preserved on `src`, across both the plain and the raw-HTML (`allowHtml`) rendering paths. It SHALL continue to strip `javascript:` and every non-image `data:`/other scheme, and SHALL NOT permit `data:` on link `href`. The DOCUMENT preview teaser link-stripper SHALL leave an embedded `![](data:…)` image intact while still removing external http/https links.

#### Scenario: Data-image markdown renders as an <img>
- **WHEN** a DOCUMENT lesson body contains `![alt](data:image/png;base64,…)`
- **THEN** it renders an `<img>` whose `src` is the original data URI
- **AND** the image is not shown as raw markdown text

#### Scenario: javascript: URI on an image is stripped
- **WHEN** markdown contains `![x](javascript:alert(1))`
- **THEN** the resulting image `src` is scrubbed to empty (never a `javascript:` URL)

#### Scenario: Preview teaser keeps embedded data-image but drops external links
- **WHEN** a locked DOCUMENT free-trial teaser body contains both `![](data:image/png;base64,…)` and an external `[text](https://…)` link
- **THEN** the embedded data-image is left intact
- **AND** the external link's URL is stripped so nothing off-page is clickable
