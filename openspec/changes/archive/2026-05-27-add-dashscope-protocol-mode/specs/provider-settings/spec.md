## ADDED Requirements

### Requirement: User selects mutually exclusive provider protocol mode

The application SHALL allow the user to choose exactly one active provider protocol mode at a time: `dashscope` (recommended) or `openai-compatible`.

#### Scenario: DashScope is recommended and default for new users

- **WHEN** the user opens Provider settings for the first time (no prior persisted mode)
- **THEN** the application SHALL select `dashscope` as the active mode
- **AND** SHALL visually indicate DashScope as the recommended option

#### Scenario: Switch protocol mode

- **WHEN** the user switches from one protocol mode to the other
- **THEN** the application SHALL persist the new `providerMode`
- **AND** SHALL load credentials and model lists from the selected mode's stored snapshot
- **AND** SHALL NOT use credentials from the inactive mode for LLM API calls

#### Scenario: Only one mode is active at runtime

- **WHEN** the application resolves settings for chat or model sync
- **THEN** it SHALL use only the active mode's `apiKey` and endpoint configuration
- **AND** SHALL NOT combine or merge settings from both modes in a single request

### Requirement: User configures DashScope protocol mode

When `providerMode` is `dashscope`, the application SHALL provide DashScope-specific configuration without requiring the user to type a full Base URL.

#### Scenario: Save DashScope settings

- **WHEN** the user selects a DashScope region, enters a non-empty API Key, and saves
- **THEN** the application SHALL persist `providerMode` as `dashscope`, the selected region, and the encrypted API Key under the DashScope settings snapshot
- **AND** SHALL resolve the effective Base URL from the region preset (default region: China Beijing — `https://dashscope.aliyuncs.com/compatible-mode/v1`)

#### Scenario: DashScope API Key security

- **WHEN** DashScope settings are persisted
- **THEN** the API Key SHALL NOT be stored in plain text on disk
- **AND** at rest the Key SHALL be encrypted by the main process (e.g. `safeStorage`)

### Requirement: Per-mode credential and model list storage

The application SHALL store separate configuration snapshots for `dashscope` and `openai-compatible`, each including its own encrypted API Key, synced model list, and enabled model IDs.

#### Scenario: Preserve inactive mode when switching

- **WHEN** the user switches protocol mode after configuring both modes at different times
- **THEN** the application SHALL retain the inactive mode's saved API Key and model lists
- **AND** SHALL restore them when the user switches back to that mode

#### Scenario: Model sync applies to active mode only

- **WHEN** the user syncs models while in DashScope mode
- **THEN** the returned model list SHALL be stored under the DashScope snapshot
- **AND** SHALL NOT overwrite the OpenAI-compatible mode's stored model list

## MODIFIED Requirements

### Requirement: User configures OpenAI-compatible endpoint

When `providerMode` is `openai-compatible`, the application SHALL provide a Settings page where the user can configure `baseURL` and `apiKey` for an OpenAI-compatible API. When `providerMode` is `dashscope`, this form SHALL NOT be shown for endpoint editing.

#### Scenario: Save valid OpenAI-compatible settings

- **WHEN** the user is in `openai-compatible` mode, enters a non-empty `baseURL` and `apiKey`, and saves
- **THEN** the application SHALL persist the settings under the OpenAI-compatible snapshot locally
- **AND** the `apiKey` SHALL NOT be persisted in plain text on disk
- **AND** at rest the `apiKey` SHALL be encrypted by the main process (e.g. `safeStorage`)
- **AND** LLM API calls (`/v1/models`, chat completions) SHALL be initiated from the renderer process using credentials held in memory after load

#### Scenario: Validate base URL format

- **WHEN** the user saves OpenAI-compatible settings with an invalid URL format
- **THEN** the application SHALL show a validation error and SHALL NOT persist invalid values

### Requirement: User syncs model list from provider

The application SHALL fetch the model list from `{effectiveBaseURL}/models` using the credentials of the **active** protocol mode.

#### Scenario: Successful model sync

- **WHEN** the user clicks sync models with valid settings for the active mode
- **THEN** the application SHALL display the returned model identifiers
- **AND** SHALL persist the synced list under the active mode's snapshot for offline display

#### Scenario: Sync failure

- **WHEN** the API returns an error or the network is unavailable
- **THEN** the application SHALL show an error message
- **AND** SHALL retain the previously synced model list for that mode if any

### Requirement: User selects enabled models

The application SHALL allow the user to select which synced models are available in the chat UI, scoped to the **active** protocol mode's enabled list.

#### Scenario: Enable models for chat

- **WHEN** the user checks one or more models in settings for the active mode
- **THEN** only checked models from that mode's enabled list SHALL appear in the chat model selector

#### Scenario: No model enabled

- **WHEN** no model is enabled for the active mode and the user opens chat
- **THEN** the application SHALL prompt the user to configure settings and enable at least one model
