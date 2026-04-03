# Disaster Recovery

## Recovery Priority

| Priority | System | RPO | RTO |
|----------|--------|-----|-----|
| P0 | API Server (hitechclaw) | 0 (stateless) | 5 min |
| P0 | Web Frontend | 0 (stateless) | 5 min |
| P1 | PostgreSQL | 24 hours | 30 min |
| P1 | MongoDB | 24 hours | 30 min |
| P2 | Redis | N/A (cache) | 5 min |

*RPO = Recovery Point Objective (max data loss), RTO = Recovery Time Objective (max downtime)*

## Backup Schedule

| Database | Frequency | Retention | Script |
|----------|-----------|-----------|--------|
| PostgreSQL | Daily 02:00 UTC | 30 days | `deploy/scripts/backup-postgres.sh` |
| MongoDB | Daily 03:00 UTC | 30 days | `deploy/scripts/backup-mongodb.sh` |
| Redis | Not backed up (cache only) | — | — |

## Recovery: Complete System Failure

If the entire system is down (all services):

```bash
# 1. Bring up infrastructure services first
docker compose up -d postgres mongodb redis

# 2. Wait for databases to be healthy
docker compose ps  # Check health status

# 3. Restore PostgreSQL (if data lost)
PGPASSWORD="$PG_PASSWORD" pg_restore \
  -h localhost -p 5432 -U hitechclaw -d hitechclaw \
  --clean --if-exists \
  < backups/postgres/hitechclaw_pg_YYYYMMDD_HHMMSS.dump

# 4. Restore MongoDB (if data lost)
mongorestore \
  --uri="mongodb://localhost:27017/hitechclaw" \
  --gzip --drop \
  backups/mongodb/hitechclaw_mongo_YYYYMMDD_HHMMSS/

# 5. Start application services
docker compose up -d hitechclaw web

# 6. Verify recovery
./deploy/scripts/health-check.sh
```

## Recovery: Single Database Failure

### PostgreSQL Down

```bash
# Check PostgreSQL container
docker compose logs postgres | tail -50

# Restart PostgreSQL
docker compose restart postgres

# If data volume corrupted — restore from backup
docker compose down postgres
docker volume rm hitechclaw_pgdata
docker compose up -d postgres
# Wait for healthy, then restore:
PGPASSWORD="$PG_PASSWORD" pg_restore -h localhost -p 5432 -U hitechclaw -d hitechclaw \
  < backups/postgres/latest.dump
```

### MongoDB Down

```bash
docker compose logs mongodb | tail -50
docker compose restart mongodb

# If data volume corrupted:
docker compose down mongodb
docker volume rm hitechclaw_mongodata
docker compose up -d mongodb
mongorestore --uri="mongodb://localhost:27017/hitechclaw" --gzip --drop \
  backups/mongodb/latest/
```

## Recovery: Application Failure

If the hitechclaw server keeps crashing:

```bash
# 1. Check logs
docker compose logs --tail 200 hitechclaw

# 2. Common causes:
#    - Database connection refused → restart DB services
#    - Migration failure → check packages/db/src/migrations/
#    - OOM killed → increase memory limit in docker-compose.prod.yml

# 3. Rollback to previous version
./deploy/scripts/rollback.sh hitechclaw <previous-tag>
```

## Data Integrity Checks

After any recovery, verify data:

```bash
# PostgreSQL — check table counts
docker compose exec postgres psql -U hitechclaw -d hitechclaw -c "
  SELECT 'tenants' as tbl, count(*) FROM tenants
  UNION ALL SELECT 'users', count(*) FROM users
  UNION ALL SELECT 'roles', count(*) FROM roles;
"

# MongoDB — check collection counts
docker compose exec mongodb mongosh hitechclaw --eval "
  ['sessions', 'messages', 'memory_entries', 'agent_configs'].forEach(c => {
    print(c + ': ' + db[c].countDocuments());
  });
"
```
