## ADDED Requirements

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

### Requirement: Assistant and user messages render Markdown

The application SHALL render message body as Markdown including GitHub-flavored extensions where supported.

#### Scenario: Render formatted text

- **WHEN** a message contains Markdown such as headings, lists, code fences, or links
- **THEN** the application SHALL render formatted output in the message bubble

#### Scenario: Render images in Markdown

- **WHEN** a message contains image syntax or allowed image HTML
- **THEN** the application SHALL display inline images in the message

#### Scenario: Sanitize unsafe content

- **WHEN** a message contains potentially unsafe HTML or scripts
- **THEN** the application SHALL sanitize output and SHALL NOT execute scripts

### Requirement: Message footer shows time model and token summary

Each message SHALL display send time, model identifier (for assistant messages), and total token count when available.

#### Scenario: Display metadata on assistant message

- **WHEN** an assistant message is shown after completion
- **THEN** the footer SHALL show localized time, model name, and total tokens as a single summary value

#### Scenario: Token detail on hover

- **WHEN** the user hovers over the token summary
- **THEN** a tooltip or popover SHALL show prompt tokens, completion tokens, and total tokens

### Requirement: User can copy message content

The application SHALL provide copy action on each message.

#### Scenario: Copy assistant message

- **WHEN** the user invokes copy on a message
- **THEN** the application SHALL copy the message plain text (or Markdown source) to the system clipboard
- **AND** SHALL give brief success feedback
