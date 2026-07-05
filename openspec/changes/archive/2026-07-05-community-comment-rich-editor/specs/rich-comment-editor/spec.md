# rich-comment-editor Specification

## Purpose
Tiptap-based WYSIWYG composer cho comment cộng đồng, xuất Markdown, hỗ trợ định dạng văn bản, link, list, code, mention và sticker inline.

## ADDED Requirements

### Requirement: Editor dùng Tiptap với SSR-safe
Component rich comment editor SHALL sử dụng `@tiptap/react` `useEditor` với `immediatelyRender: false` để tránh hydration mismatch trong Next.js App Router.

#### Scenario: Editor mount trên client
- **WHEN** the rich comment editor renders on a post detail or feed thread
- **THEN** it initializes Tiptap only on the client and does not cause a hydration mismatch

### Requirement: Định dạng văn bản đầy đủ
Editor SHALL hỗ trợ các định dạng: bold, italic, underline, strikethrough, link, bullet list, ordered list, blockquote, code inline, code block. Heading SHALL NOT be enabled.

#### Scenario: Apply bold
- **GIVEN** the user selected text in the editor
- **WHEN** they activate the bold toolbar button or press Ctrl/Cmd+B
- **THEN** the selected text becomes bold

#### Scenario: Apply italic
- **GIVEN** the user selected text in the editor
- **WHEN** they activate the italic toolbar button or press Ctrl/Cmd+I
- **THEN** the selected text becomes italic

#### Scenario: Apply underline
- **GIVEN** the user selected text in the editor
- **WHEN** they activate the underline toolbar button or press Ctrl/Cmd+U
- **THEN** the selected text becomes underlined

#### Scenario: Apply strikethrough
- **GIVEN** the user selected text in the editor
- **WHEN** they activate the strikethrough toolbar button
- **THEN** the selected text has a line through it

#### Scenario: Insert link
- **GIVEN** the user selected text or placed the caret
- **WHEN** they activate the link toolbar button and enter a URL
- **THEN** the selected text becomes a hyperlink

#### Scenario: Apply bullet list
- **WHEN** the user activates the bullet list toolbar button
- **THEN** the current paragraph becomes a bulleted list item

#### Scenario: Apply ordered list
- **WHEN** the user activates the ordered list toolbar button
- **THEN** the current paragraph becomes a numbered list item

#### Scenario: Apply blockquote
- **WHEN** the user activates the blockquote toolbar button
- **THEN** the current paragraph is styled as a blockquote

#### Scenario: Apply inline code
- **GIVEN** the user selected text
- **WHEN** they activate the inline code toolbar button
- **THEN** the selected text is wrapped in inline code style

#### Scenario: Apply code block
- **GIVEN** the user is on an empty paragraph or selected a paragraph
- **WHEN** they activate the code block toolbar button
- **THEN** the paragraph becomes a fenced code block

### Requirement: Toolbar icon Phosphor và HeroUI
Toolbar format buttons SHALL use icons from `@phosphor-icons/react` and HeroUI `Button` với `isIconOnly` và `onPress`.

#### Scenario: Toolbar renders
- **WHEN** the rich editor toolbar is visible
- **THEN** every format button is an icon-only HeroUI Button with an `aria-label`

### Requirement: Xuất Markdown
Editor SHALL expose the current content as Markdown via `tiptap-markdown` (`editor.storage.markdown.getMarkdown()`). Submit handler SHALL receive a plain string body.

#### Scenario: Submit formatted comment
- **GIVEN** the user typed "**hello**" and a bullet list
- **WHEN** the submit action is triggered
- **THEN** the onSubmit callback receives a Markdown string containing `**hello**` and list syntax

### Requirement: Emoji insert inline
Editor SHALL integrate the existing `EmojiPicker` and insert the selected emoji into the editor content at the current caret position.

#### Scenario: Insert emoji
- **GIVEN** the editor is focused
- **WHEN** the user selects an emoji from the picker
- **THEN** the emoji is inserted into the editor content and the editor keeps focus

### Requirement: Sticker insert as inline image
Editor SHALL integrate the existing `StickerPicker` and insert the selected sticker as an inline Tiptap image node.

#### Scenario: Insert sticker
- **GIVEN** the editor is focused
- **WHEN** the user selects a sticker from the picker
- **THEN** an inline image node is inserted and serialized as `![label](/stickers/<file>.svg)` on submit

### Requirement: Mention mock user list
Editor SHALL support `@` mention using `@tiptap/extension-mention` with a static mock user list. The mention node SHALL serialize to a Markdown link `[@displayName](/u/<username>)`.

#### Scenario: Trigger mention suggestion
- **GIVEN** the user types "@" in the editor
- **WHEN** the mention suggestion list appears
- **THEN** it shows the mock users and selecting one inserts a mention node

#### Scenario: Mention serializes to profile link
- **GIVEN** the editor contains a mention of user "Minh Trần" with username "minh-tran"
- **WHEN** the content is exported to Markdown
- **THEN** the mention is rendered as `["@Minh Trần"](/u/minh-tran)`

### Requirement: Composer-in-box layout
Editor SHALL render inside a single bounded box (`rounded-2xl border border-separator focus-within:border-accent`) with a flat editor zone on top and the toolbar row `[format buttons] · flex-1 · [emoji] [sticker] [send]` on the bottom.

#### Scenario: Composer box renders
- **WHEN** the rich comment composer is displayed
- **THEN** it is one rounded bordered box containing the editable area and toolbar row, with no separate bordered input

### Requirement: Send shortcut Ctrl/Cmd+Enter
Submit SHALL be triggered by `Ctrl+Enter` or `Cmd+Enter`. Pressing `Enter` without modifier SHALL insert a newline.

#### Scenario: Ctrl+Enter submits
- **GIVEN** the editor has non-empty content
- **WHEN** the user presses Ctrl+Enter
- **THEN** the onSubmit callback is invoked

#### Scenario: Enter inserts newline
- **GIVEN** the user is inside a list or paragraph
- **WHEN** they press Enter
- **THEN** a new line or list item is created and submit is not triggered

### Requirement: Empty submit guard
Submit SHALL be disabled/no-op when the editor content is empty (no text, no sticker, no mention).

#### Scenario: Empty editor blocked
- **GIVEN** the editor is empty
- **WHEN** the user presses Ctrl+Enter or activates the send button
- **THEN** no submit occurs

### Requirement: Clear content on successful submit
After onSubmit returns `true`, the editor SHALL clear its content.

#### Scenario: Successful submit clears editor
- **GIVEN** the submit callback resolves to true
- **WHEN** the success is received
- **THEN** the editor content is cleared

## MODIFIED Requirements

*None — this is a new capability.*

## REMOVED Requirements

*None.*
