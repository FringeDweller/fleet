# Disaster Recovery Runbook

## Overview
This document outlines the procedures for recovering the Fleet Management System in the event of a disaster.

## Objectives
- **RTO (Recovery Time Objective):** < 4 hours
- **RPO (Recovery Point Objective):** < 15 minutes

## Backup Strategy
- **Database:**
    - Automated daily logical backups via `scripts/db-backup.sh`.
    - Continuous archiving (WAL) enabling Point-in-Time Recovery (PITR) is managed by the cloud provider (e.g., AWS RDS, Crunchy Data).
- **Application Config:**
    - Infrastructure as Code (IaC) is versioned in Git.
    - Environment variables are backed up in the secure vault.

## Recovery Procedures

### 1. Database Restoration
**Scenario:** Data corruption or accidental deletion.

**Steps:**
1.  Identify the last known good state timestamp.
2.  If using Cloud SQL/RDS:
    - Use the console to "Restore to point in time".
    - Update the application `DATABASE_URL` to point to the new instance if necessary.
3.  If using Manual Backups:
    - Locate the latest valid backup file (e.g., `backups/backup_20251228_120000.sql.gz`).
    - Run the restore script:
        ```bash
        ./scripts/db-restore.sh backups/backup_20251228_120000.sql.gz
        ```

### 2. Full System Recovery
**Scenario:** Region outage or complete infrastructure loss.

**Steps:**
1.  **Provision Infrastructure:**
    - Deploy the stack to a new region using Terraform/Pulumi/Helm.
2.  **Restore Data:**
    - Restore the database from the cross-region replica or S3 backup.
    - Restore Redis cache (optional, can be cold-started).
3.  **Update DNS:**
    - Update DNS records to point to the new load balancer.
4.  **Verify:**
    - Run acceptance tests.
    - Verify `/healthz` endpoint.

## Testing
- DR drills should be conducted quarterly.
- Backup restoration integrity should be verified automatically once a week.
