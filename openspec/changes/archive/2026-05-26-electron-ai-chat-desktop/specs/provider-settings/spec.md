## ADDED Requirements

### Requirement: User configures OpenAI-compatible endpoint

The application SHALL provide a Settings page where the user can configure `baseURL` and `apiKey` for an OpenAI-compatible API.

#### Scenario: Save valid settings

- **WHEN** the user enters a non-empty `baseURL` and `apiKey` and saves
- **THEN** the application SHALL persist the settings locally
- **AND** the `apiKey` SHALL NOT be persisted in plain text on disk
- **AND** at rest the `apiKey` SHALL be encrypted by the main process (e.g. `safeStorage`)
- **AND** LLM API calls (`/v1/models`, chat completions) SHALL be initiated from the renderer process using credentials held in memory after load

#### Scenario: Validate base URL format

- **WHEN** the user saves settings with an invalid URL format
- **THEN** the application SHALL show a validation error and SHALL NOT persist invalid values

### Requirement: User syncs model list from provider

The application SHALL fetch the model list from `{baseURL}/v1/models` using the configured credentials.

#### Scenario: Successful model sync

- **WHEN** the user clicks sync models with valid settings
- **THEN** the application SHALL display the returned model identifiers
- **AND** SHALL persist the synced list for offline display

#### Scenario: Sync failure

- **WHEN** the API returns an error or the network is unavailable
- **THEN** the application SHALL show an error message
- **AND** SHALL retain the previously synced model list if any

### Requirement: User selects enabled models

The application SHALL allow the user to select which synced models are available in the chat UI.

#### Scenario: Enable models for chat

- **WHEN** the user checks one or more models in settings
- **THEN** only checked models SHALL appear in the chat model selector

#### Scenario: No model enabled

- **WHEN** no model is enabled and the user opens chat
- **THEN** the application SHALL prompt the user to configure settings and enable at least one model
