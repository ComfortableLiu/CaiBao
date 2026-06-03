# multimodal-messages Specification

## Purpose

Define how user messages carry image attachment metadata, upload via S3-compatible storage, and map to multimodal API payloads with vision and MIME limits.
## Requirements
### Requirement: Message supports image attachments metadata

User messages MAY include attachments with `id`, `mimeType`, `objectKey`, `url`, and optional metadata; binaries SHALL NOT live in conversation JSON.

#### Scenario: Persist metadata without binary payload

- **WHEN** a user message with uploaded images is saved locally
- **THEN** the conversation JSON SHALL store attachment metadata only
- **AND** SHALL NOT embed image file bytes in the message record

### Requirement: Attachments use saved S3-compatible settings only

Uploads SHALL use persisted runtime settings via the main process; no environment variable configuration.

#### Scenario: Upload when storage ready

- **WHEN** object storage is ready per setup-gate rules and the user sends images
- **THEN** the application SHALL upload and persist attachment metadata before streaming

#### Scenario: Upload blocked when storage not ready

- **WHEN** object storage is not ready
- **THEN** the chat setup overlay SHALL prevent sending messages
- **AND** attachment controls SHALL NOT be usable

### Requirement: API payload uses HTTP image_url parts

Multimodal `content` arrays SHALL use stored attachment URLs for `image_url` parts.

#### Scenario: Build multimodal user message for API

- **WHEN** the application sends a user message that has stored attachment URLs
- **THEN** the request payload SHALL include `image_url` parts referencing those HTTP(S) URLs

### Requirement: Attachment limits and MIME types

The application SHALL enforce a maximum of 10 MB per file, 5 attachments per message, and SHALL accept only jpeg, png, gif, and webp MIME types.

#### Scenario: Reject oversized or unsupported file

- **WHEN** the user selects a file larger than 10 MB or with an unsupported MIME type
- **THEN** the application SHALL reject the file
- **AND** SHALL NOT add it to pending attachments

### Requirement: Vision capability

Attachment controls SHALL additionally require a vision-capable model when the overlay is not shown.

#### Scenario: Hide attachment control without vision model

- **WHEN** the active model is not marked as vision-capable
- **THEN** the composer SHALL NOT offer image attachment controls

