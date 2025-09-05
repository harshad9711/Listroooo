require('dotenv').config();
const { Pool } = require('pg');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Email transporter
const transporter = nodemailer.createTransporter(process.env.SMTP_URL);

// Twilio client
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

// Function to check inventory levels
async function checkInventoryLevels() {
  try {
    const client = await pool.connect();
    
    // Query to check low inventory items
    const result = await client.query(`
      SELECT product_name, current_stock, min_stock_level 
      FROM inventory 
      WHERE current_stock <= min_stock_level
    `);
    
    client.release();
    
    if (result.rows.length > 0) {
      await sendAlerts(result.rows);
    }
  } catch (error) {
    console.error('Error checking inventory levels:', error);
  }
}

// Function to send alerts
async function sendAlerts(lowStockItems) {
  const alertMessage = `Low inventory alert: ${lowStockItems.length} items need restocking.\n\n` +
    lowStockItems.map(item => 
      `${item.product_name}: ${item.current_stock}/${item.min_stock_level}`
    ).join('\n');
  
  // Send email alert
  try {
    await transporter.sendMail({
      from: process.env.ALERT_EMAIL,
      to: process.env.ALERT_EMAIL,
      subject: 'Low Inventory Alert',
      text: alertMessage
    });
    console.log('Email alert sent successfully');
  } catch (error) {
    console.error('Error sending email alert:', error);
  }
  
  // Send SMS alert
  try {
    await twilioClient.messages.create({
      body: alertMessage,
      from: process.env.TWILIO_PHONE,
      to: process.env.ALERT_PHONE
    });
    console.log('SMS alert sent successfully');
  } catch (error) {
    console.error('Error sending SMS alert:', error);
  }
}

// Schedule the cron job
cron.schedule(process.env.CRON_SCHEDULE, () => {
  console.log('Running inventory check...');
  checkInventoryLevels();
}, {
  timezone: process.env.TIMEZONE
});

console.log('Inventory alert system started');
console.log(`Cron schedule: ${process.env.CRON_SCHEDULE}`);
console.log(`Timezone: ${process.env.TIMEZONE}`);

// Keep the process running
process.on('SIGINT', () => {
  console.log('Shutting down inventory alert system...');
  pool.end();
  process.exit(0);
}); 