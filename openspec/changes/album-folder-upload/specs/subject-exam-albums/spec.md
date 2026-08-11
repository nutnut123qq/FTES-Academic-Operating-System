# subject-exam-albums

## ADDED Requirements

### Requirement: An FE exam album can be filled by picking a whole folder
Both surfaces that take FE-album pictures SHALL offer a folder picker ALONGSIDE the
existing multi-file picker: the new-contribution picker
(`SubjectPractice/ExamContribute` → `AlbumImagePicker`) and the curator panel of an
existing album (`SubjectFeAlbum/FeAlbumManager`). The file picker SHALL NOT be removed,
because contributors also hold loose scans. The folder picker SHALL be a hidden
`<input type="file">` whose `webkitdirectory` and `directory` attributes are set
IMPERATIVELY through the ref callback (React's `input` typings declare neither),
mirroring `ChallengeMethodSolver`. Images found in SUB-FOLDERS SHALL be included, since
exam folders are commonly `CSD201/2024/…`.

#### Scenario: Picking a folder fills the album
- **WHEN** the contributor picks the folder `CSD201/` holding `de1.png`, `de2.png`, `de10.png`
- **THEN** all three pictures enter the album pick list
- **AND** the multi-file picker is still offered next to the folder picker

#### Scenario: Sub-folders are included
- **WHEN** the picked folder holds `CSD201/2023/de1.png` and `CSD201/2024/de1.png`
- **THEN** both pictures are taken, ordered by their full relative path (`2023` before `2024`)

### Requirement: A folder pick is filtered, naturally ordered, and capped — never silently
A folder pick SHALL keep only pictures the album endpoint accepts
(`FE_ALBUM_IMAGE_MIME`; a file the browser reports no MIME for is judged by its
`.png`/`.jpg`/`.jpeg`/`.webp` extension and re-typed) and SHALL drop anything else
(`Thumbs.db`, `.DS_Store`, stray PDFs) and anything over `FE_ALBUM_MAX_IMAGE_MB`.
Survivors SHALL be ordered by NATURAL comparison of their relative path (`de1`, `de2`,
`de10` — never `de1`, `de10`, `de2`), because pick order is the `sortOrder` the BE stamps
on arrival and therefore the album's page order. The album cap SHALL be respected —
the SERVER's `maxImages` where the album payload carries it, otherwise
`FE_ALBUM_MAX_IMAGES` — by keeping the first N of the SORTED order. Every file left out
SHALL be reported to the user with its count and reason (wrong type / too large / over
the cap); a pick SHALL NOT be silently truncated, and an over-cap folder SHALL NOT fail
the whole pick.

#### Scenario: Non-picture files are skipped and reported
- **WHEN** the picked folder holds 12 images plus `Thumbs.db` and a stray PDF
- **THEN** the 12 images are taken
- **AND** a message states that 2 files were skipped for not being accepted pictures

#### Scenario: Human ordering, not lexicographic
- **WHEN** the picked folder holds `de1.png`, `de2.png`, `de10.png`
- **THEN** the album order is `de1`, `de2`, `de10`

#### Scenario: Over the cap, the first pages are kept and the rest are reported
- **WHEN** an empty album with a 50-picture cap receives a folder of 60 images
- **THEN** the first 50 of the natural order are taken
- **AND** a message states how many were accepted and that 10 were not added
- **AND** the pick does not fail

### Requirement: A folder pick uploads through the existing paced, sequential path
A folder pick SHALL NOT introduce a parallel or bulk upload path. Pictures added to an
EXISTING album SHALL go through `useMutateAddFeAlbumImagesSwr` — one
`POST /resources/{id}/images` at a time, self-paced against the server's 10/min · 60/hour
limit with the `429` back-off and the cancel control — so a 50-image folder throttles
exactly like a 50-file multi-pick. Pictures of a NEW contribution SHALL stay local until
submit and then run the unchanged `useMutateCreateFeAlbumSwr` chain (create → N sequential
images → submit).

#### Scenario: A 50-image folder paces itself
- **WHEN** a curator adds a folder of 50 images to an existing album
- **THEN** the pictures upload one at a time in album order
- **AND** the panel reports the pacing wait once the per-minute allowance is used up
- **AND** the run can still be cancelled mid-way
