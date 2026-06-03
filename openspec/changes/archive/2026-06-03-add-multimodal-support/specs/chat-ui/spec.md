## ADDED Requirements

### Requirement: Composer supports image attachments

The composer SHALL allow users to add, preview, and remove image attachments before sending, in addition to text input.

#### Scenario: Add image via file picker

- **WHEN** the user invokes the attachment control and selects one or more image files
- **THEN** the composer SHALL show previews for accepted images
- **AND** SHALL NOT add rejected files

#### Scenario: Paste image from clipboard

- **WHEN** the user pastes clipboard content that includes an image
- **THEN** the composer SHALL add the image to pending attachments

#### Scenario: Drag and drop image

- **WHEN** the user drops image files onto the composer area
- **THEN** the composer SHALL add accepted images to pending attachments

#### Scenario: Remove pending attachment

- **WHEN** the user removes a pending attachment before send
- **THEN** the composer SHALL remove its preview
- **AND** SHALL NOT include it in the next send

#### Scenario: Send with attachments only

- **WHEN** the user has no text but has at least one pending attachment and presses send
- **THEN** the application SHALL upload attachments and send the message

#### Scenario: Send disabled without content

- **WHEN** the composer has no text and no pending attachments
- **THEN** the send control SHALL be disabled

### Requirement: User message bubble displays attached images

User messages with attachments SHALL display inline image thumbnails using the stored object storage HTTP(S) URL.

#### Scenario: Display attachments in user bubble

- **WHEN** a user message has stored attachments with `url`
- **THEN** the message bubble SHALL render each attachment as an `<img>` (or equivalent) sourced from that URL
- **AND** SHALL still render `content` as Markdown when non-empty

## MODIFIED Requirements

### Requirement: Chat layout follows mainstream IM patterns

The chat page SHALL use a familiar instant-messaging layout: conversation list, scrollable message thread, and composer at the bottom.

#### Scenario: Send with keyboard

- **WHEN** the user presses Enter in the composer without Shift
- **THEN** the application SHALL send the message

#### Scenario: New line in composer

- **WHEN** the user presses Shift+Enter
- **THEN** the application SHALL insert a newline without sending

#### Scenario: Scroll behavior

- **WHEN** new content streams at the bottom and the user is already at the bottom
- **THEN** the message list SHALL auto-scroll to follow the stream

### Requirement: User can copy message content

The application SHALL provide copy action on each message.

#### Scenario: Copy assistant message

- **WHEN** the user invokes copy on a message
- **THEN** the application SHALL copy the message plain text (or Markdown source) to the system clipboard
- **AND** SHALL give brief success feedback

#### Scenario: Copy user message with attachments

- **WHEN** the user invokes copy on a user message that has attachments
- **THEN** the application SHALL copy the text `content` to the clipboard
- **AND** SHALL NOT copy image URLs or binary unless the user explicitly chooses an export action (out of scope for MVP)
