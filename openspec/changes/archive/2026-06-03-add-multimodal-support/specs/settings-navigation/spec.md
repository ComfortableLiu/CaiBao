## ADDED Requirements

### Requirement: Settings page uses sidebar navigation layout

The Settings page SHALL use a two-column layout: a left sidebar directory and a right content area for the active section's controls.

#### Scenario: Navigate between sections

- **WHEN** the user selects an item in the left sidebar
- **THEN** the right panel SHALL display only that section's settings
- **AND** the selected sidebar item SHALL be visually highlighted

#### Scenario: Deep link from setup overlay

- **WHEN** the user opens Settings from the setup overlay for a specific missing configuration
- **THEN** the Settings page SHALL open with the corresponding sidebar section already selected (e.g. provider or object storage)

### Requirement: Settings sections cover provider object storage and chat preferences

The sidebar SHALL include at minimum: model provider configuration, object storage (S3-compatible), and chat preferences (theme, thinking, search toggles).

#### Scenario: Provider section

- **WHEN** the user selects the provider section
- **THEN** the right panel SHALL show DashScope and OpenAI-compatible configuration consistent with existing provider-settings behavior

#### Scenario: Object storage section

- **WHEN** the user selects the object storage section
- **THEN** the right panel SHALL show all S3-compatible fields and test connection

#### Scenario: Chat preferences section

- **WHEN** the user selects chat preferences
- **THEN** the right panel SHALL show theme and chat-related toggles (e.g. enable thinking, enable search)

### Requirement: Settings UI does not expose environment variable configuration

The Settings page SHALL NOT provide inputs or documentation encouraging `.env` or environment-variable-based configuration for provider or object storage.

#### Scenario: Runtime-only configuration

- **WHEN** the user configures any storage or provider parameter
- **THEN** the value SHALL be saved only through the settings persistence API
