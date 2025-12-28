# Fleet Management System - API Documentation

## Overview
The API is built using Nuxt 3 server routes (Nitro). All API endpoints are prefixed with `/api`.

## Authentication
Most endpoints require authentication via a session cookie.
- **Login**: `POST /api/auth/login`
- **Logout**: `POST /api/auth/logout`

## Common Endpoints

### Assets
- `GET /api/assets`: List assets (supports pagination and filtering).
- `GET /api/assets/:id`: Get asset details.
- `POST /api/assets`: Create a new asset.
- `PUT /api/assets/:id`: Update an asset.

### Work Orders
- `GET /api/work-orders`: List work orders.
- `POST /api/work-orders`: Create a work order.
- `POST /api/work-orders/:id/complete`: Mark a work order as complete.

### Inspections
- `GET /api/inspections`: List inspections.
- `POST /api/inspections`: Submit a new inspection.

### Monitoring
- `GET /api/healthz`: System health check.
- `GET /api/metrics`: Prometheus metrics.

## Error Handling
Errors are returned in JSON format:
```json
{
  "statusCode": 400,
  "statusMessage": "Bad Request",
  "message": "Validation failed"
}
```
