# community-comment-composer-tools Specification

## Purpose
Toolbar affordances for the community comment composer that let users insert Unicode emoji and select pixel-art stickers while keeping the existing backend `body: string` contract unchanged.

## ADDED Requirements

### Requirement: Textarea border radius
The community comment composer textarea SHALL render with `rounded-2xl` instead of `rounded-large`.

#### Scenario: Composer renders
- **WHEN** the comment composer is displayed
- **THEN** the textarea has corner radius `rounded-2xl`

### Requirement: Emoji picker in toolbar
The composer SHALL render an emoji picker button in its toolbar. Activating the button SHALL open a HeroUI `Popover` containing a static grid of ~40 Unicode emoji characters. Activating an emoji SHALL insert that emoji into the textarea draft at the current caret position and close the popover.

#### Scenario: Open emoji picker
- **WHEN** the user activates the emoji toolbar button
- **THEN** a HeroUI `Popover` opens displaying the curated emoji grid

#### Scenario: Insert emoji at caret
- **GIVEN** the user has placed the caret in the middle of the draft text
- **WHEN** they select an emoji from the picker
- **THEN** the emoji is inserted at the caret position, the textarea keeps focus, and the popover closes

#### Scenario: Emoji picker uses no new dependencies
- **WHEN** the emoji picker renders
- **THEN** it uses only a local static array of Unicode strings; no additional emoji library is loaded

### Requirement: Sticker picker in toolbar
The composer SHALL render a sticker picker button in its toolbar. Activating the button SHALL open a HeroUI `Popover` containing a grid of SVG stickers copied from the `pixelarticons` package into `public/stickers/`. Activating a sticker SHALL add a chip preview inside the composer representing the selected sticker.

#### Scenario: Open sticker picker
- **WHEN** the user activates the sticker toolbar button
- **THEN** a HeroUI `Popover` opens displaying the sticker grid

#### Scenario: Select sticker shows chip preview
- **WHEN** the user selects a sticker from the picker
- **THEN** a chip preview appears inside the composer showing the sticker icon and label, and the popover closes

#### Scenario: Remove sticker preview
- **GIVEN** a sticker chip preview is present in the composer
- **WHEN** the user activates the chip's remove action
- **THEN** the chip is removed and no sticker is sent on the next submit

### Requirement: Serialize sticker as Markdown image on submit
When the user submits a comment that has a selected sticker, the composer SHALL append a Markdown image reference `![](/stickers/<sticker-name>.svg)` to the textual `body` before calling the existing create-comment mutation. The final payload SHALL remain a plain `string` in the `body` field.

#### Scenario: Submit text plus sticker
- **GIVEN** the user typed "Hay quá" and selected a sticker named "like"
- **WHEN** they submit the comment
- **THEN** the mutation receives `body` equal to "Hay quá\n\n![](/stickers/like.svg)" (or equivalent placement near the text)

#### Scenario: Submit sticker-only comment
- **GIVEN** the user selected a sticker but typed no text
- **WHEN** they submit the comment
- **THEN** the mutation receives `body` equal to "![](/stickers/<name>.svg)"

#### Scenario: No backend schema change
- **WHEN** the create-comment request is built
- **THEN** the GraphQL variables still contain only `body: string`; no new field is added

### Requirement: Preserve existing composer behaviors
The enhanced composer SHALL keep all existing behaviors: auto-growing height, Enter submits, Shift+Enter inserts a newline, submit is disabled when the input is empty (and no sticker selected), mobile sticky bottom positioning, optimistic thread update, and draft restoration when submission fails.

#### Scenario: Empty input blocked
- **GIVEN** the textarea is empty and no sticker is selected
- **WHEN** the user presses Enter or activates the send button
- **THEN** submit is disabled/no-ops and no comment is created

#### Scenario: Sticker enables empty submit
- **GIVEN** the textarea is empty and a sticker is selected
- **WHEN** the user submits
- **THEN** the sticker-only Markdown image is sent

#### Scenario: Shift+Enter inserts newline
- **WHEN** the user presses Shift+Enter inside the textarea
- **THEN** a newline is inserted and the comment is not submitted

#### Scenario: Failure preserves draft and sticker
- **GIVEN** the create-comment mutation fails
- **WHEN** the error is received
- **THEN** the optimistic comment is rolled back, the draft text is restored, and the selected sticker chip remains selected

### Requirement: Toolbar icons use Phosphor
All toolbar control icons (emoji button, sticker button, chip remove) SHALL use icons from the `@phosphor-icons/react` set, except for the sticker artwork itself which uses the `pixelarticons` SVG files.

#### Scenario: Toolbar renders
- **WHEN** the composer toolbar is visible
- **THEN** the emoji and sticker buttons use Phosphor icons

### Requirement: Localized toolbar labels
All toolbar accessible labels and sticker alt text SHALL come from the next-intl message catalogs. New keys SHALL be added to every locale, not only Vietnamese.

#### Scenario: Switch locale
- **WHEN** the active locale changes
- **THEN** the emoji button label, sticker button label, and sticker alt text render in the active language
