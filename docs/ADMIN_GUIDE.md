# Fleet Management System - Administrator Guide

## Introduction
This guide is for System Administrators responsible for configuring and maintaining the Fleet Management System.

## User Management
- **Add User**: Go to "Settings" > "Users" > "Add User". Assign a role (Operator, Technician, Admin).
- **Roles & Permissions**: Configure what each role can access in "Settings" > "Roles".

## System Configuration
- **Organization Settings**: Update company details and preferences.
- **Notification Settings**: Configure email and push notification providers.

## Maintenance Setup
- **Preventive Maintenance**:
    1.  Go to "Settings" > "Maintenance Schedules".
    2.  Define triggers (e.g., Every 5000 km or 6 months).
    3.  Assign to Asset Categories or specific Assets.
- **Task Library**: Define standard repair tasks and estimated hours.

## Data Management
- **Import Data**: Use the "Import" tool to bulk upload Assets, Parts, or Users via CSV.
- **Export Data**: Most lists have an "Export" button for reporting.

## Monitoring
- **Audit Logs**: View "Settings" > "Audit Log" to track user actions.
- **System Health**: Check `/api/healthz` for system status.
- **Backups**: Database backups are performed daily. See `DISASTER_RECOVERY.md` for details.
