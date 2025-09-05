# Production Deployment Instructions

## Prerequisites
- Docker and Docker Compose installed
- Production database credentials
- Production environment variables

## Deployment Steps

1. **Set Environment Variables**
   ```bash
   cd production
   cp .env.production .env
   # Edit .env with your production values
   ```

2. **Deploy with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Verify Deployment**
   - Frontend: http://localhost
   - Backend API: http://localhost/api/ugc/analytics
   - Database: localhost:5432

4. **Monitor Logs**
   ```bash
   docker-compose logs -f
   ```

## Environment Variables Required

- `PGHOST`: PostgreSQL host
- `PGUSER`: PostgreSQL user
- `PGPASSWORD`: PostgreSQL password
- `PGDATABASE`: PostgreSQL database name
- `JWT_SECRET`: JWT signing secret
- `SESSION_SECRET`: Session secret
- `SHOPIFY_API_KEY`: Shopify API key
- `SHOPIFY_API_SECRET`: Shopify API secret
- `SHOPIFY_REDIRECT_URI`: Shopify redirect URI

## Backup and Restore

### Backup Database
```bash
docker-compose exec postgres pg_dump -U $PGUSER $PGDATABASE > backup.sql
```

### Restore Database
```bash
docker-compose exec -T postgres psql -U $PGUSER $PGDATABASE < backup.sql
```
