# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Security**: Added security headers, rate limiting, CSRF protection, and encryption for sensitive asset data.
- **High Availability**: Added `/healthz` endpoint, database read replica support, and graceful worker shutdown.
- **Monitoring**: Added structured JSON logging and `/api/metrics` endpoint.
- **Documentation**: Added User Guide, Admin Guide, API docs, and Disaster Recovery procedures.

### Changed
- **Performance**: Added database indexes to critical tables.
- **Architecture**: Moved notifications to a background queue (BullMQ).

### Fixed
- None.
