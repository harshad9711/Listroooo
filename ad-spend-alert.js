#!/usr/bin/env node
/**
 * ad-spend-alert.js
 *
 * Periodically checks ad campaign spend and conversions to prevent wasted budget:
 *  - Alerts when campaign spend ≥ spend_limit AND conversions = 0 (once per campaign)
 *
 * Setup:
 *   npm install pg dotenv node-cron nodemailer twilio
 *   Ensure `.env` defines:
 *     DATABASE_URL, SMTP_URL, ALERT_EMAIL,
 *     TWILIO_SID, TWILIO_TOKEN, TWILIO_PHONE, ALERT_PHONE,
 *     TIMEZONE (e.g. America/New_York), CRON_SCHEDULE (e.g. '0 * * * *')
 */

import 'dotenv/config';
import { Client } from 'pg';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import Twilio from 'twilio';

// Configure email transporter and Twilio client
const mailer = nodemailer.createTransport({ url: process.env.SMTP_URL });
const twClient = new Twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

// Send alert when a campaign is overspending without conversions
async function sendOverspendAlert(campaign) {
  const msg = `⚠️ Campaign "${campaign.name}" (ID ${campaign.id}) has spent $${campaign.spend.toFixed(2)} without conversions. Budget limit: $${campaign.spend_limit.toFixed(2)}.`;
  
  try {
    await mailer.sendMail({
      to: process.env.ALERT_EMAIL,
      subject: 'Ad Spend Alert – No Conversions',
      text: msg,
    });
    console.log(`📧 Email alert sent for campaign "${campaign.name}"`);
  } catch (err) {
    console.error('❌ Failed to send email alert:', err);
  }

  try {
    await twClient.messages.create({
      to: process.env.ALERT_PHONE,
      from: process.env.TWILIO_PHONE,
      body: msg,
    });
    console.log(`📱 SMS alert sent for campaign "${campaign.name}"`);
  } catch (err) {
    console.error('❌ Failed to send SMS alert:', err);
  }
}

// Main job: query campaigns and send alerts
async function checkAdSpend() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('🔍 Checking ad campaigns for overspend...');

    const { rows } = await client.query(`
      SELECT id, name, spend, conversions, spend_limit
      FROM ad_campaigns
      WHERE spend >= spend_limit
        AND conversions = 0
        AND alerted_overspend = false
    `);

    console.log(`Found ${rows.length} campaigns with overspend and no conversions`);

    for (const campaign of rows) {
      await sendOverspendAlert(campaign);
      await client.query(
        'UPDATE ad_campaigns SET alerted_overspend = true WHERE id = $1',
        [campaign.id]
      );
      console.log(`🔔 Alert sent for overspend on campaign "${campaign.name}" (ID ${campaign.id})`);
    }

    if (rows.length === 0) {
      console.log('✅ No campaigns require alerts at this time');
    }
  } catch (err) {
    console.error('❌ Ad spend check failed:', err);
  } finally {
    await client.end();
  }
}

// Schedule the job (default hourly)
cron.schedule(process.env.CRON_SCHEDULE || '0 * * * *', () => {
  console.log('🕐 Running ad spend check at', new Date().toISOString());
  checkAdSpend();
}, {
  timezone: process.env.TIMEZONE || 'UTC'
});

console.log('🚀 Ad spend alert service started');
console.log(`⏰ Schedule: ${process.env.CRON_SCHEDULE || '0 * * * *'}`);
console.log(`🌍 Timezone: ${process.env.TIMEZONE || 'UTC'}`);

// To run once instead of on a schedule, comment out the cron.schedule block
// and call checkAdSpend() directly. 