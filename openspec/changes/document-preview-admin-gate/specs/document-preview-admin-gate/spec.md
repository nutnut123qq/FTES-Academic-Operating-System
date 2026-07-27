# document-preview-admin-gate

## ADDED Requirements

### Requirement: Document preview teaser renders no clickable links
The document reader SHALL NOT render clickable links inside a DOCUMENT preview teaser. When a
non-purchaser views a DOCUMENT lesson as a free-trial preview (`isLocked` with
`accessLevel === "PREVIEW"` and `contentType === "DOCUMENT"`), the reader SHALL strip links from the
teaser body before rendering — keeping the visible link/anchor text but dropping every URL and href
(markdown inline links and images, reference-style links and their definitions, autolinks, bare
`http(s)://…` URLs, and HTML `<a>` anchors) — and SHALL derive its link-only detection, written-body
detection, and rendered markdown from that stripped body. A viewer with FULL access SHALL see the
original body with working links.

#### Scenario: Preview teaser with a markdown link is not clickable
- **WHEN** a non-purchaser views a DOCUMENT lesson as a PREVIEW whose teaser body contains a markdown
  link `[tài liệu](https://example.com/paid)` and a bare URL `https://drive.example.com/x`
- **THEN** the reader shows the text "tài liệu"
- **AND** the reader does not render the URL `https://example.com/paid` or `https://drive.example.com/x`

#### Scenario: Purchaser keeps working links
- **WHEN** a viewer with FULL access opens the same DOCUMENT lesson
- **THEN** the reader renders the original body including its links and URLs

#### Scenario: Hard-locked document shows no body
- **WHEN** a non-purchaser opens a DOCUMENT lesson whose `accessLevel` is NONE (Admin has not enabled preview)
- **THEN** the reader shows the hard paywall with no teaser body and no links
