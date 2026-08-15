# link-preview-unfurl (delta)

## ADDED Requirements

### Requirement: Server-side unfurl endpoint fenced against SSRF

`GET /api/unfurl?url=…` SHALL fetch a caller-supplied page on the server and return its share card
(`og:*` → `twitter:*` → `<title>` / `<meta name="description">`, plus an absolute image URL and the
display domain) as JSON. Because the server issues a request to a URL the caller picks, the endpoint
SHALL enforce all of:

- scheme is `http` or `https`, and the URL carries no embedded credentials;
- the host is rejected when it is a bare hostname (no dot) or ends in `.localhost`, `.local`,
  `.internal`, `.home.arpa`;
- the resolved address is rejected when it is loopback, an RFC1918 private block, link-local
  `169.254.0.0/16` (the cloud metadata endpoint), CGNAT, benchmarking, multicast/reserved, or `0.x`;
- DNS is resolved and re-checked BEFORE every hop, not once up front;
- redirects are followed manually, at most 3 hops, each hop re-validated;
- one shared deadline of 5 seconds covers the whole chain;
- the response body read is capped.

Blocked or unusable input SHALL answer 400; a page that cannot be previewed (unreachable, non-HTML,
error status) SHALL answer 404. The route SHALL run on the Node runtime, since the guard resolves DNS.

#### Scenario: Internal address is refused

- **WHEN** the requested URL resolves to `127.0.0.1`, a private range, or `169.254.169.254`
- **THEN** the endpoint refuses it and never issues the request

#### Scenario: Redirect into an internal address is refused

- **WHEN** a public URL redirects to an address in a blocked range
- **THEN** the hop is re-validated and refused, rather than being followed because the first hop was public

### Requirement: The unfurl body cap is large enough for streamed metadata

The HTML read cap SHALL be 1 MiB and the whole capped body SHALL be scanned for share tags — the
scan SHALL NOT stop at `</head>`.

This is not a size preference. Our own Next pages inline the RSC payload ahead of the share tags:
on `/en/blog/<slug>` `og:title` sits at roughly byte 309k of a 315k document, so the earlier 256 KiB
cap truncated it and every FTES link unfurled as "no preview". Those same tags are emitted AFTER
`</head>` by streamed metadata, so stopping at the head close would reintroduce the same blind spot.

#### Scenario: An FTES link unfurls

- **WHEN** a link to one of our own blog pages is unfurled
- **THEN** its `og:title` / `og:description` / `og:image` are found even though they sit past 256 KiB
  and after `</head>`

### Requirement: Unfurl results are memoized in-process

Results SHALL be cached per final URL inside the server process: successes for 10 minutes, failures
for 60 seconds (so a dead link is not re-fetched on every render), with a bounded number of entries
evicting the oldest. Responses SHALL carry a public cache-control header. No external cache
dependency SHALL be introduced.

#### Scenario: A busy post

- **WHEN** many viewers open a post containing the same link within the TTL
- **THEN** the target site is fetched once per server instance, not once per render

### Requirement: A community post shows one preview card for its first link

A community post body SHALL render a preview card for the FIRST link it contains, and only that one.
Link detection SHALL ignore fenced and inline code (a URL inside code is a quote, not a link) and
SHALL drop trailing sentence punctuation from the detected URL.

The card SHALL be treated as decoration: while the unfurl is in flight, or when the page cannot be
previewed, the card SHALL render nothing at all — the link itself is already in the body, so a slow
or dead third-party site never leaves a broken box behind. The card SHALL open the link in a new tab.

Bodies SHALL be rendered with CommonMark autolinks unwrapped, so `<https://…>` reads as `https://…`
instead of showing the authored angle brackets. Both forms already become a real anchor through the
shared markdown renderer, so this changes the TEXT only.

#### Scenario: Post with a link

- **WHEN** a post body contains two links
- **THEN** exactly one card renders, for the first link, under the body

#### Scenario: Post whose only link is inside a code block

- **WHEN** the only URL in the body sits inside a fenced code block
- **THEN** no card renders

#### Scenario: Target site cannot be previewed

- **WHEN** the unfurl returns 404/400 or is still loading
- **THEN** nothing is rendered where the card would be
