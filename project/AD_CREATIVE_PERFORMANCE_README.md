# Ad Creative Performance Monitor

This script monitors ad creative performance across multiple platforms to identify top converters and wasted spend.

## Features

- **Top Performers Analysis**: Identifies the 5 best-performing creatives per platform (lowest cost per conversion)
- **Wasted Spend Detection**: Alerts on creatives with zero conversions and spend above threshold
- **Multi-Platform Support**: Monitors TikTok, Meta (Facebook/Instagram), and Google Ads
- **Dual Notifications**: Sends detailed email summaries and SMS alerts
- **Duplicate Prevention**: Uses `alerted_low_performance` flag to prevent spam

## Database Schema

Ensure your `ad_creatives` table has these columns:

```sql
CREATE TABLE ad_creatives (
  id SERIAL PRIMARY KEY,
  creative_name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'tiktok', 'meta', 'google'
  spend DECIMAL(10,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  alerted_low_performance BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Environment Variables

Add these to your `.env` file:

```env
# Database
DATABASE_URL=postgres://user:pass@host:port/dbname

# Email (SMTP)
SMTP_URL=smtp://username:password@smtp.example.com:587
ALERT_EMAIL=alerts@yourcompany.com

# SMS (Twilio)
TWILIO_SID=ACxxxx
TWILIO_TOKEN=your_twilio_token
TWILIO_PHONE=+1XXX     # Twilio number
ALERT_PHONE=+1YYY      # Your phone

# Scheduling
TIMEZONE=America/New_York
CRON_SCHEDULE=0 * * * *  # Every hour
SPEND_THRESHOLD=50       # Minimum spend to consider "wasted"
```

## Usage

### Run as Service
```bash
node ad-creative-performance.js
```

### Run Once
Comment out the `cron.schedule` block and add:
```javascript
checkAdCreativePerformance();
```

## Sample Output

### Email Summary
```
Ad Creative Performance – TIKTOK

🏆 Top 5 Converters (Cost per Conversion):
1. Summer Sale Video: $2.45 per conversion
2. Product Demo: $3.12 per conversion
3. Customer Testimonial: $4.20 per conversion

⚠️ Wasted Spend (0 conversions):
1. Old Campaign Video: $75.00 spent
2. Test Creative: $52.30 spent
```

### SMS Notification
```
Ad performance summary for TIKTOK sent to email.
```

## Performance Metrics

The script calculates **cost per conversion** as:
```
cost_per_conversion = spend / conversions
```

Lower values indicate better performance.

## Alert Logic

**Top Performers**: Creatives with:
- `conversions > 0`
- `spend > 0`
- Sorted by lowest cost per conversion
- Limited to top 5 per platform

**Wasted Spend**: Creatives with:
- `conversions = 0`
- `spend >= SPEND_THRESHOLD`
- `alerted_low_performance = false`

## Platforms Supported

- **TikTok**: `platform = 'tiktok'`
- **Meta**: `platform = 'meta'` (Facebook/Instagram)
- **Google**: `platform = 'google'` (Google Ads)

## Scheduling Options

- `0 * * * *` - Every hour
- `0 */2 * * *` - Every 2 hours
- `0 9-17 * * *` - Every hour, 9 AM to 5 PM
- `0 9 * * 1-5` - 9 AM daily, Monday to Friday

## Error Handling

- Database connection failures are logged
- Email/SMS sending failures are logged separately
- Script continues running even if individual notifications fail
- Graceful handling of division by zero in cost calculations

## Security Notes

- Store credentials in environment variables
- Use secure SMTP connections (TLS/SSL)
- Ensure database connection uses SSL in production
- Regularly rotate Twilio tokens 