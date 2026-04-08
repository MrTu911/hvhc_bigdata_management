# HVHC BigData Database Backup

## Restore Instructions

### On New PostgreSQL Server:

1. Create database:
```sql
CREATE DATABASE hvhc_bigdata;
```

2. Push schema from Prisma:
```bash
cd nextjs_space
yarn prisma db push
```

3. Import CSV data using psql:
```bash
# For each table:
psql -h localhost -U postgres -d hvhc_bigdata -c "\COPY users FROM 'csv/users.csv' WITH CSV HEADER"
psql -h localhost -U postgres -d hvhc_bigdata -c "\COPY units FROM 'csv/units.csv' WITH CSV HEADER"
# ... repeat for other tables
```

Or use the restore script:
```bash
./scripts/import_csv.sh
```

## Files Included:
- schema.prisma: Database schema
- csv/*.csv: Table data in CSV format
