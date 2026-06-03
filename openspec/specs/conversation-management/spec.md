## Purpose

The application manages multiple local conversations with auto-generated titles, persistence on disk, and lifecycle cleanup of associated object-storage attachments.
## Requirements
### Requirement: User manages multiple conversations

The application SHALL support multiple concurrent chat conversations with switching between them.

#### Scenario: Create new conversation

- **WHEN** the user creates a new chat
- **THEN** the application SHALL open an empty conversation
- **AND** SHALL add it to the conversation list

#### Scenario: Switch conversation

- **WHEN** the user selects another conversation in the list
- **THEN** the application SHALL load and display that conversation's messages

### Requirement: Conversation title auto-generated from first message

After the user sends the first message in a new conversation, the application SHALL generate and display a short title.

#### Scenario: Title generated after first send

- **WHEN** the user sends the first message in a conversation with a default title
- **THEN** the application SHALL asynchronously request a concise title summary
- **AND** SHALL update the sidebar title when the summary returns

#### Scenario: Title generation failure

- **WHEN** title generation fails
- **THEN** the application SHALL keep a fallback title derived from the first message preview

### Requirement: Conversations persist on local disk

All conversations and messages SHALL be stored on the user's local filesystem and restored on application restart.

#### Scenario: Persist after message

- **WHEN** a user or assistant message is completed or updated during stream
- **THEN** the application SHALL write changes to local storage under the app user data directory

#### Scenario: Restore on launch

- **WHEN** the application starts
- **THEN** it SHALL load the conversation list and last-opened or first conversation messages from disk

#### Scenario: Persist user message with attachments

- **WHEN** the user sends a message that includes attachments
- **THEN** the application SHALL upload images via the configured S3 API and persist message JSON with attachment metadata before initiating the assistant stream

### Requirement: User can delete conversations

The application SHALL allow deleting a conversation and its messages from local storage.

#### Scenario: Delete with confirmation

- **WHEN** the user requests delete on a conversation
- **THEN** the application SHALL ask for confirmation
- **AND** upon confirm SHALL remove the conversation file and list entry

#### Scenario: Delete active conversation

- **WHEN** the user deletes the currently open conversation
- **THEN** the application SHALL navigate to another conversation or an empty new chat state

### Requirement: Message records reference S3 objects

The application SHALL persist attachment metadata (including `objectKey` and `url`) in local conversation JSON while storing image bytes in the configured S3-compatible bucket.

#### Scenario: Persist attachment metadata with message

- **WHEN** a user message with attachments is saved locally
- **THEN** the conversation JSON SHALL include attachment metadata for each uploaded object
- **AND** each object SHALL already exist in the configured bucket

#### Scenario: Restore attachments on launch

- **WHEN** the application loads a conversation containing messages with attachments
- **THEN** the application SHALL use stored URLs (or refresh presigned URLs) for display and API replay without requiring local image files

### Requirement: Deleting a conversation removes its S3 objects

When a conversation is deleted, the application SHALL remove associated objects from the configured bucket under that conversation's key prefix using the **current** object storage settings.

#### Scenario: Delete conversation with images

- **WHEN** the user confirms deletion of a conversation that has messages with attachments
- **THEN** the application SHALL delete the local conversation record
- **AND** SHALL delete all objects under `{keyPrefix}/{conversationId}/` (default prefix `attachments`)

