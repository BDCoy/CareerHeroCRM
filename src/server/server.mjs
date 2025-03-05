// Import required modules
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  })
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Webhook routes
// SendGrid Inbound Parse webhook
app.post('/api/webhooks/sendgrid/inbound', upload.any(), (req, res) => {
  try {
    console.log('Received SendGrid Inbound Parse webhook');
    
    // Log the request body and files
    console.log('Request body:', req.body);
    console.log('Files:', req.files);
    
    // Extract email data
    const { from, to, subject, text, html } = req.body;
    
    // Process attachments
    const attachments = req.files ? req.files.map(file => ({
      filename: file.originalname,
      path: file.path,
      contentType: file.mimetype,
      size: file.size
    })) : [];
    
    console.log('Extracted email data:');
    console.log('From:', from);
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Attachments:', attachments.length);
    
    // In a real implementation, you would process the email and create a customer
    // For now, we'll just acknowledge receipt
    
    res.status(200).json({
      success: true,
      message: 'Email received and processed successfully',
      data: {
        from,
        to,
        subject,
        attachments: attachments.map(a => a.filename)
      }
    });
  } catch (error) {
    console.error('Error processing SendGrid webhook:', error);
    res.status(500).json({
      success: false,
      message: `Error processing webhook: ${error.message}`
    });
  }
});

// Twilio SMS webhook
app.post('/api/webhooks/twilio/sms', (req, res) => {
  try {
    console.log('Received Twilio SMS webhook');
    
    // Extract SMS data
    const { From, Body, MessageSid } = req.body;
    
    console.log('SMS From:', From);
    console.log('SMS Body:', Body);
    console.log('MessageSid:', MessageSid);
    
    // Return a TwiML response
    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Message>Thank you for your message. We'll get back to you soon.</Message>
      </Response>
    `);
  } catch (error) {
    console.error('Error processing Twilio SMS webhook:', error);
    
    // Even on error, return a TwiML response
    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Message>Sorry, we couldn't process your message. Please try again later.</Message>
      </Response>
    `);
  }
});

// Twilio WhatsApp webhook
app.post('/api/webhooks/twilio/whatsapp', (req, res) => {
  try {
    console.log('Received Twilio WhatsApp webhook');
    
    // Extract WhatsApp data
    const { From, Body, MessageSid } = req.body;
    
    console.log('WhatsApp From:', From);
    console.log('WhatsApp Body:', Body);
    console.log('MessageSid:', MessageSid);
    
    // Return a TwiML response
    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Message>Thank you for your WhatsApp message. We'll get back to you soon.</Message>
      </Response>
    `);
  } catch (error) {
    console.error('Error processing Twilio WhatsApp webhook:', error);
    
    // Even on error, return a TwiML response
    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Message>Sorry, we couldn't process your WhatsApp message. Please try again later.</Message>
      </Response>
    `);
  }
});

// API routes for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'API server is running' });
});

// Serve static files from the 'dist' directory if available
const distPath = join(dirname(__dirname), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Catch-all route to serve the React app
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
  console.log(`SendGrid webhook URL: http://localhost:${PORT}/api/webhooks/sendgrid/inbound`);
  console.log(`Twilio SMS webhook URL: http://localhost:${PORT}/api/webhooks/twilio/sms`);
  console.log(`Twilio WhatsApp webhook URL: http://localhost:${PORT}/api/webhooks/twilio/whatsapp`);
});

// Export the app for testing
export default app;