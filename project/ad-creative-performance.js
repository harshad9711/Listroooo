#!/usr/bin/env node
/**
 * ad-creative-performance.js
 *
 * Periodically checks ad creative performance to identify top converters and wasted spend:
 *  - Sends a summary of top 5 creatives (lowest cost per conversion) per platform.
 *  - Alerts on creatives with zero conversions and spend above threshold.
 *
 * Setup:
 *   npm install pg dotenv node-cron nodemailer twilio
 *   Ensure `.env` defines:
 *     DATABASE_URL       - your Postgres connection string
 *     SMTP_URL           - e.g. smtp://user:pass@smtp.example.com:587
 *     ALERT_EMAIL        - email to receive summaries
 *     TWILIO_SID         - your Twilio Account SID
 *     TWILIO_TOKEN       - your Twilio Auth Token
 *     TWILIO_PHONE       - your Twilio "from" number
 *     ALERT_PHONE        - number to receive SMS notifications
 *     TIMEZONE           - e.g. America/New_York
 *     CRON_SCHEDULE      - cron expression, e.g. '0 * * * *' for hourly
 *     SPEND_THRESHOLD    - minimum spend to consider "wasted" (default: 50)
 */

import 'dotenv/config';
import { Client } from 'pg';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import Twilio from 'twilio';

// Configure mailer and Twilio client
const mailer = nodemailer.createTransport({ url: process.env.SMTP_URL });
const twClient = new Twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

async function sendPerformanceSummary(platform, topCreatives, wastedCreatives) {
  let text = `Ad Creative Performance – ${platform.toUpperCase()}\n\n`;
  
  if (topCreatives.length > 0) {
    text += '🏆 Top 5 Converters (Cost per Conversion):\n';
    topCreatives.forEach((c, index) => {
      text += `${index + 1}. ${c.creative_name}: $${c.cost_per_conversion.toFixed(2)} per conversion\n`;
    });
  }
  
  if (wastedCreatives.length > 0) {
    text += '\n⚠️ Wasted Spend (0 conversions):\n';
    wastedCreatives.forEach((c, index) => {
      text += `${index + 1}. ${c.creative_name}: $${c.spend.toFixed(2)} spent\n`;
    });
  }
  
  if (topCreatives.length === 0 && wastedCreatives.length === 0) {
    text += 'No significant performance data to report.';
  }

  try {
    // Send email
    await mailer.sendMail({
      to: process.env.ALERT_EMAIL,
      subject: `Ad Performance Summary – ${platform.toUpperCase()}`,
      text,
    });
    console.log(`📧 Email summary sent for ${platform}`);
  } catch (err) {
    console.error(`❌ Failed to send email for ${platform}:`, err);
  }

  try {
    // Send SMS notification
    await twClient.messages.create({
      to: process.env.ALERT_PHONE,
      from: process.env.TWILIO_PHONE,
      body: `Ad performance summary for ${platform.toUpperCase()} sent to email.`,
    });
    console.log(`📱 SMS notification sent for ${platform}`);
  } catch (err) {
    console.error(`❌ Failed to send SMS for ${platform}:`, err);
  }
}

async function checkAdCreativePerformance() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('🔍 Checking ad creative performance...');
    
    const platforms = ['tiktok', 'meta', 'google'];
    const spendThreshold = parseFloat(process.env.SPEND_THRESHOLD || '50');

    for (const platform of platforms) {
      console.log(`📊 Analyzing ${platform} creatives...`);
      
      // Top 5 by cost per conversion
      const topRes = await client.query(
        `SELECT id, creative_name, spend, conversions,
                (spend::float / NULLIF(conversions, 0)) AS cost_per_conversion
         FROM ad_creatives
         WHERE platform = $1
           AND conversions > 0
           AND spend > 0
         ORDER BY cost_per_conversion ASC
         LIMIT 5`,
        [platform]
      );

      // Wasted spend creatives
      const wasteRes = await client.query(
        `SELECT id, creative_name, spend
         FROM ad_creatives
         WHERE platform = $1
           AND conversions = 0
           AND spend >= $2
           AND alerted_low_performance = false`,
        [platform, spendThreshold]
      );

      const topCreatives = topRes.rows;
      const wastedCreatives = wasteRes.rows;

      console.log(`  - Top performers: ${topCreatives.length}`);
      console.log(`  - Wasted spend: ${wastedCreatives.length}`);

      if (topCreatives.length || wastedCreatives.length) {
        await sendPerformanceSummary(platform, topCreatives, wastedCreatives);
        
        // Mark wasted creatives as alerted
        const ids = wastedCreatives.map(c => c.id);
        if (ids.length) {
          await client.query(
            'UPDATE ad_creatives SET alerted_low_performance = true WHERE id = ANY($1)',
            [ids]
          );
          console.log(`  - Marked ${ids.length} creatives as alerted`);
        }
      } else {
        console.log(`  - No significant data for ${platform}`);
      }
    }
    
    console.log('✅ Ad creative performance check completed');
  } catch (err) {
    console.error('❌ Ad creative performance check failed:', err);
  } finally {
    await client.end();
  }
}

// Schedule the job (hourly by default)
cron.schedule(process.env.CRON_SCHEDULE || '0 * * * *', () => {
  console.log('🕐 Running ad creative performance check at', new Date().toISOString());
  checkAdCreativePerformance();
}, { 
  timezone: process.env.TIMEZONE || 'UTC' 
});

console.log('🚀 Ad creative performance monitoring service started');
console.log(`⏰ Schedule: ${process.env.CRON_SCHEDULE || '0 * * * *'}`);
console.log(`🌍 Timezone: ${process.env.TIMEZONE || 'UTC'}`);
console.log(`💰 Spend threshold: $${process.env.SPEND_THRESHOLD || '50'}`);

// To run once instead of continuously, comment out the cron.schedule block above
// and simply call: checkAdCreativePerformance(); 