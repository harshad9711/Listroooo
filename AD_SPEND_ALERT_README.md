# Ad Spend Alert Script

This script periodically checks ad campaign spend and conversions to prevent wasted budget by alerting when campaigns are overspending without conversions.

## Features

- Monitors ad campaigns for overspend without conversions
- Sends alerts via both email and SMS
- Prevents duplicate alerts with `alerted_overspend` flag
- Configurable scheduling and timezone
- Comprehensive logging

## Setup

### 1. Dependencies

All required dependencies are already installed in this project:
- `pg` - PostgreSQL client
- `dotenv` - Environment variable management
- `node-cron` - Cron job scheduling
- `nodemailer` - Email sending
- `twilio` - SMS sending

### 2. Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
DATABASE_URL=postgres://user:pass@host:port/dbname

# Email Configuration (SMTP)
SMTP_URL=smtp://username:password@smtp.example.com:587
ALERT_EMAIL=alerts@yourcompany.com

# Twilio Configuration (SMS)
TWILIO_SID=ACxxxx
TWILIO_TOKEN=your_twilio_token
TWILIO_PHONE=+1XXX     # Twilio number
ALERT_PHONE=+1YYY      # Your alert recipient

# Scheduling Configuration
TIMEZONE=America/New_York
CRON_SCHEDULE=0 * * * *  # Every hour at minute 0
```

### 3. Database Schema

Ensure your `ad_campaigns` table has the following columns:
- `id` - Campaign ID
- `name` - Campaign name
- `spend` - Current spend amount
- `conversions` - Number of conversions
- `spend_limit` - Budget limit
- `alerted_overspend` - Boolean flag to prevent duplicate alerts

## Usage

### Run as a Service

```bash
node ad-spend-alert.js
```

The script will start and run according to the `CRON_SCHEDULE` (default: every hour).

### Run Once

To run the check once instead of on a schedule, comment out the `cron.schedule` block and add:

```javascript
checkAdSpend();
```

### Cron Schedule Examples

- `0 * * * *` - Every hour
- `0 */2 * * *` - Every 2 hours
- `0 9-17 * * *` - Every hour between 9 AM and 5 PM
- `0 9 * * 1-5` - Every day at 9 AM, Monday to Friday

## Alert Logic

The script alerts when:
1. Campaign spend ≥ spend_limit
2. Conversions = 0
3. `alerted_overspend` = false (prevents duplicate alerts)

After sending an alert, the script sets `alerted_overspend = true` to prevent duplicate notifications.

## Alert Message Format

```
⚠️ Campaign "Campaign Name" (ID 123) has spent $150.00 without conversions. Budget limit: $100.00.
```

## Logging

The script provides detailed logging:
- Service startup information
- Campaign check results
- Alert sending status
- Error messages

## Error Handling

- Database connection errors are logged
- Email/SMS sending failures are logged separately
- The script continues running even if individual alerts fail

## Security Notes

- Store sensitive credentials in environment variables
- Use secure SMTP connections (TLS/SSL)
- Ensure database connection uses SSL in production
- Regularly rotate Twilio tokens 