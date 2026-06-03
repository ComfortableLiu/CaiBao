# app-setup-gate Specification

## Purpose

Block chat with a setup overlay until provider and object-storage configuration are saved in the UI, while keeping Settings always accessible.
## Requirements
### Requirement: Chat is blocked until required runtime configuration is complete

The application SHALL determine readiness from persisted settings only (not environment variables). Until all required configuration is complete, the chat experience SHALL be blocked by a semi-transparent overlay.

#### Scenario: Provider not configured

- **WHEN** the active provider lacks a valid API Key, endpoint resolution, or at least one enabled model
- **THEN** the chat page SHALL display a semi-transparent overlay covering chat functionality
- **AND** SHALL explain that provider settings must be configured
- **AND** SHALL offer a control to open Settings

#### Scenario: Object storage not configured

- **WHEN** the provider is ready but object storage is not enabled or lacks required fields (endpoint, bucket, credentials)
- **THEN** the chat page SHALL display a semi-transparent overlay
- **AND** SHALL explain that S3-compatible object storage must be configured
- **AND** SHALL offer a control to open Settings focused on object storage

#### Scenario: All required configuration complete

- **WHEN** both provider and object storage readiness checks pass
- **THEN** the overlay SHALL NOT be shown
- **AND** the user SHALL be able to use chat and image attachments (subject to model vision support)

### Requirement: Settings remain accessible while chat is blocked

The application SHALL NOT apply the setup overlay to the Settings page or Settings tab.

#### Scenario: Open settings from overlay

- **WHEN** the user activates "go to settings" from the overlay
- **THEN** the application SHALL navigate to Settings
- **AND** SHALL select the sidebar section relevant to the missing configuration

#### Scenario: Configure without overlay obstruction

- **WHEN** the user is on the Settings page
- **THEN** all settings forms SHALL be fully interactive regardless of readiness state

### Requirement: Configuration readiness ignores environment variables

The application SHALL NOT use environment variables as a source of provider or object storage configuration for readiness checks or runtime behavior.

#### Scenario: No env fallback

- **WHEN** the application starts with no persisted object storage credentials
- **THEN** object storage SHALL be considered not ready even if OS environment variables are set
- **AND** the setup overlay SHALL be shown until the user saves valid settings through the UI

