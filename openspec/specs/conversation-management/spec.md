## ADDED Requirements

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

### Requirement: User can delete conversations

The application SHALL allow deleting a conversation and its messages from local storage.

#### Scenario: Delete with confirmation

- **WHEN** the user requests delete on a conversation
- **THEN** the application SHALL ask for confirmation
- **AND** upon confirm SHALL remove the conversation file and list entry

#### Scenario: Delete active conversation

- **WHEN** the user deletes the currently open conversation
- **THEN** the application SHALL navigate to another conversation or an empty new chat state
