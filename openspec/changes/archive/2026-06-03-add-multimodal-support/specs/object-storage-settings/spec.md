## ADDED Requirements

### Requirement: User configures S3-compatible object storage at runtime

The application SHALL provide settings to configure S3-compatible object storage without environment variables, and SHALL persist changes to local settings.

#### Scenario: Save object storage settings

- **WHEN** the user enables object storage, enters endpoint, region, bucket, credentials, and related options in the object storage section, and saves
- **THEN** the application SHALL persist the configuration to local settings
- **AND** subsequent uploads SHALL use the saved configuration without restart

#### Scenario: Example endpoint in UI only

- **WHEN** the user views the endpoint field
- **THEN** the UI MAY show placeholder or helper text such as `http://code-pulse.cn:6800` as an example
- **AND** SHALL NOT load that value from environment variables automatically

### Requirement: Object storage credentials are encrypted at rest

Access key and secret key SHALL be encrypted in settings.json; secret left blank on save retains previous value.

#### Scenario: Persist credentials

- **WHEN** credentials are saved
- **THEN** they SHALL NOT be stored in plain text

### Requirement: User can test object storage connection

The application SHALL let the user test object storage connectivity using the current form or saved settings via IPC and SHALL report success or a clear error.

#### Scenario: Test connection from settings

- **WHEN** the user invokes test connection in the object storage section
- **THEN** the application SHALL validate credentials and bucket access via the main process
- **AND** SHALL display success or a descriptive failure message in the UI

### Requirement: Configurable S3 client options

The application SHALL support `forcePathStyle`, `publicBaseUrl`, `keyPrefix`, and optional presigned GET URLs with configurable expiry.

#### Scenario: Save advanced S3 options

- **WHEN** the user saves object storage settings including path style, public base URL, key prefix, or presign expiry
- **THEN** the application SHALL persist those options
- **AND** subsequent uploads and URL generation SHALL use the saved values

### Requirement: Object storage enabled flag

When `enabled` is false or required fields are missing, `isObjectStorageReady` SHALL be false and the chat setup overlay SHALL apply (after provider is ready).

#### Scenario: Overlay when storage disabled

- **WHEN** object storage is disabled or required fields are incomplete while the provider is ready
- **THEN** `isObjectStorageReady` SHALL be false
- **AND** the chat setup overlay SHALL block chat until configuration is complete
