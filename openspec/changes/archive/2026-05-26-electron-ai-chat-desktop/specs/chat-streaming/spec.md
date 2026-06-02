## ADDED Requirements

### Requirement: Chat completions are requested from the renderer

The application SHALL initiate streaming chat completion HTTP requests from the renderer process (not proxied through the main process).

#### Scenario: Direct API stream

- **WHEN** the user sends a chat message
- **THEN** the renderer SHALL call the configured OpenAI-compatible streaming endpoint
- **AND** SHALL update the UI from stream chunks without IPC relay of stream data

### Requirement: Assistant response streams in real time

The application SHALL send chat requests with streaming enabled and SHALL update the assistant message incrementally as chunks arrive.

#### Scenario: Stream text content

- **WHEN** the user sends a message and the API returns streamed content deltas
- **THEN** the application SHALL append content to the assistant message in the UI without waiting for completion

#### Scenario: Stream ends successfully

- **WHEN** the stream completes
- **THEN** the application SHALL finalize the message content
- **AND** SHALL persist the complete message to local storage

### Requirement: Reasoning content displayed separately when present

When the API provides reasoning or thinking deltas (e.g. `reasoning_content`), the application SHALL display them in a distinct collapsible section from the final answer.

#### Scenario: Reasoning chunks during stream

- **WHEN** reasoning deltas arrive before or during answer content
- **THEN** the application SHALL show reasoning in a labeled thinking section
- **AND** SHALL stream updates to that section in real time

#### Scenario: No reasoning field

- **WHEN** the API provides only standard `content` deltas
- **THEN** the application SHALL NOT show an empty thinking section

### Requirement: Token usage captured per assistant message

The application SHALL record token usage for each assistant message when provided by the API.

#### Scenario: Usage in final chunk

- **WHEN** the stream includes `usage` with prompt, completion, and total tokens
- **THEN** the application SHALL attach usage to the assistant message record

#### Scenario: Usage unavailable

- **WHEN** the API does not return usage
- **THEN** the application SHALL display token usage as unavailable or zero without failing the message

### Requirement: User can abort an in-flight stream

The application SHALL allow canceling an ongoing generation.

#### Scenario: Abort streaming

- **WHEN** the user aborts while a response is streaming
- **THEN** the application SHALL stop receiving chunks
- **AND** SHALL keep partial content persisted with an aborted state if applicable
