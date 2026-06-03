## ADDED Requirements

### Requirement: Chat history includes multimodal user messages

When assembling message history for streaming chat completion, the application SHALL preserve multimodal structure for user messages that include attachments.

#### Scenario: History with image message

- **WHEN** prior user messages in the conversation include attachments with stored URLs
- **THEN** the request payload SHALL include those messages as multimodal `content` arrays with `image_url` parts using the stored HTTP(S) URLs

#### Scenario: Retry with attachments

- **WHEN** the user retries an assistant response after a user message that had attachments
- **THEN** the application SHALL include the same multimodal user content (with valid URLs) in the truncated history

## MODIFIED Requirements

### Requirement: Chat completions are requested from the renderer

The application SHALL initiate streaming chat completion HTTP requests from the renderer process (not proxied through the main process).

#### Scenario: Direct API stream

- **WHEN** the user sends a chat message
- **THEN** the renderer SHALL call the configured OpenAI-compatible streaming endpoint
- **AND** SHALL update the UI from stream chunks without IPC relay of stream data

#### Scenario: Multimodal request body

- **WHEN** the user sends a message with image attachments uploaded to object storage
- **THEN** the renderer SHALL build the user message in OpenAI multimodal format with `image_url` HTTP(S) URLs before calling the streaming endpoint
