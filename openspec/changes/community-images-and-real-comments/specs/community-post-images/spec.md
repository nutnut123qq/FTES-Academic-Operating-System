# community-post-images

## ADDED Requirements

### Requirement: Attach images to a community post
The composer SHALL let the author attach up to 4 images to a post, showing a thumbnail preview of
each pick and letting any pick be removed before submitting.

#### Scenario: Pick and preview
- **WHEN** the author selects two images in the composer
- **THEN** two thumbnails appear and the post can still be submitted

#### Scenario: Remove a pick
- **WHEN** the author removes one of the previewed images
- **THEN** that thumbnail disappears and the image is not sent with the post

#### Scenario: Limit reached
- **WHEN** the author already has 4 images attached
- **THEN** the picker refuses further images and explains the limit

### Requirement: Client-side validation mirrors the server
The picker SHALL reject a file larger than 10 MB or whose type is not PNG, JPEG, WebP or GIF, before
any upload is attempted, and SHALL explain why.

#### Scenario: Oversized file
- **WHEN** the author picks a 20 MB image
- **THEN** no upload request is sent and a size message is shown

#### Scenario: Unsupported type
- **WHEN** the author picks a PDF
- **THEN** no upload request is sent and a format message is shown

### Requirement: Upload before submit
Each accepted image SHALL be uploaded through `POST /api/v1/community/media` as soon as it is picked,
and the post SHALL be submitted with the returned secure URLs as its `media` entries. While any
upload is in flight the submit action SHALL be unavailable.

#### Scenario: Upload then post
- **WHEN** the author attaches an image and submits the post
- **THEN** the create request carries a `media` entry whose `storageKey` is the URL returned by the upload

#### Scenario: Upload fails
- **WHEN** an image upload fails
- **THEN** that image is dropped from the preview with an error message, and the rest of the draft is kept

#### Scenario: Submit blocked while uploading
- **WHEN** an upload is still running
- **THEN** the submit action is disabled until it settles

### Requirement: Posts render their images
The feed card and the post detail SHALL render a post's attached images when the post has any, and
render nothing extra when it has none.

#### Scenario: Post with images in the feed
- **WHEN** a feed row's post carries two images
- **THEN** both are rendered in the row, in their server-provided order

#### Scenario: Post without images
- **WHEN** a post carries no images
- **THEN** the card renders no image area at all
