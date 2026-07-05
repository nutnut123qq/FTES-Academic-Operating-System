# community-comment-composer-tools Specification

## Purpose
Shared comment composer tools: emoji picker, sticker picker, và rich text editor integration cho community comment composer.

## ADDED Requirements

*None — modifications only.*

## MODIFIED Requirements

### Requirement: Textarea border radius
The community comment composer SHALL render with `rounded-2xl` as part of the composer-in-box.

#### Scenario: Composer renders
- **WHEN** the comment composer is displayed
- **THEN** the composer box has corner radius `rounded-2xl`

### Requirement: Emoji picker in toolbar
The composer SHALL render an emoji picker button in its toolbar. Activating the button SHALL open a HeroUI `Popover` containing a static grid of ~40 Unicode emoji characters. Activating an emoji SHALL insert that emoji into the editor at the current caret position and close the popover.

#### Scenario: Open emoji picker
- **WHEN** the user activates the emoji toolbar button
- **THEN** a HeroUI `Popover` opens displaying the curated emoji grid

#### Scenario: Insert emoji at caret
- **GIVEN** the user has placed the caret in the middle of the editor content
- **WHEN** they select an emoji from the picker
- **THEN** the emoji is inserted at the caret position, the editor keeps focus, and the popover closes

#### Scenario: Emoji picker uses no new dependencies
- **WHEN** the emoji picker renders
- **THEN** it uses only a local static array of Unicode strings; no additional emoji library is loaded

### Requirement: Sticker picker in toolbar
The composer SHALL render a sticker picker button in its toolbar. Activating the button SHALL open a HeroUI `Popover` containing a grid of SVG stickers copied from the `pixelarticons` package into `public/stickers/`. Activating a sticker SHALL insert an inline image node into the editor.

#### Scenario: Open sticker picker
- **WHEN** the user activates the sticker toolbar button
- **THEN** a HeroUI `Popover` opens displaying the sticker grid

#### Scenario: Select sticker inserts inline image
- **WHEN** the user selects a sticker from the picker
- **THEN** an inline image node is inserted into the editor content at the caret position, and the popover closes

### Requirement: Serialize sticker as Markdown image on submit
When the user submits a comment that contains a sticker image node, the composer SHALL serialize it as a Markdown image reference `![label](/stickers/<sticker-name>.svg)` within the textual `body`. The final payload SHALL remain a plain `string` in the `body` field.

#### Scenario: Submit text plus sticker
- **GIVEN** the user typed "Hay quá" and inserted a heart sticker
- **WHEN** they submit the comment
- **THEN** the mutation receives `body` equal to "Hay quá\n\n![Yêu thích](/stickers/heart.svg)" (or equivalent placement near the text)

#### Scenario: Submit sticker-only comment
- **GIVEN** the user inserted a sticker but typed no text
- **WHEN** they submit the comment
- **THEN** the mutation receives `body` equal to "![label](/stickers/<name>.svg)"

#### Scenario: No backend schema change
- **WHEN** the create-comment request is built
- **THEN** the GraphQL variables still contain only `body: string`; no new field is added

### Requirement: Preserve existing composer behaviors
The enhanced composer SHALL keep all existing behaviors: auto-growing height, submit is disabled when the input is empty, mobile sticky bottom positioning, optimistic thread update, and draft restoration when submission fails.

#### Scenario: Empty input blocked
- **GIVEN** the editor is empty and no sticker is inserted
- **WHEN** the user activates the send action
- **THEN** submit is disabled/no-ops and no comment is created

#### Scenario: Sticker enables empty submit
- **GIVEN** the editor contains only an inline sticker image
- **WHEN** the user submits
- **THEN** the sticker-only Markdown image is sent

#### Scenario: Failure preserves draft
- **GIVEN** the create-comment mutation fails
- **WHEN** the error is received
- **THEN** the optimistic comment is rolled back and the editor content is preserved

### Requirement: Toolbar icons use Phosphor
All toolbar control icons (format buttons, emoji button, sticker button) SHALL use icons from the `@phosphor-icons/react` set, except for the sticker artwork itself which uses the `pixelarticons` SVG files.

#### Scenario: Toolbar renders
- **WHEN** the composer toolbar is visible
- **THEN** the format, emoji, and sticker buttons use Phosphor icons

### Requirement: Localized toolbar labels
All toolbar accessible labels and sticker alt text SHALL come from the next-intl message catalogs. New keys SHALL be added to every locale, not only Vietnamese.

#### Scenario: Switch locale
- **WHEN** the active locale changes
- **THEN** the toolbar button labels and sticker alt text render in the active language

## REMOVED Requirements

*None.*
