import { Request, Response } from 'express';
import { simulateIncomingEmail, EmailAttachment, processIncomingEmail } from './emailParser';
import { Customer } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Handle incoming webhook from Twilio SendGrid Inbound Parse
 * This processes emails forwarded by SendGrid's Inbound Parse webhook
 * 
 * @param req The Express request object
 * @param res The Express response object
 */
export const handleSendGridInboundWebhook = async (req: Request, res: Response) => {
  try {
    console.log('Received SendGrid Inbound Parse webhook');
    
    // Extract email data from the webhook payload
    const { from, to, subject, text, html, attachments = [] } = req.body;
    
    // Process attachments if they exist
    const processedAttachments: EmailAttachment[] = [];
    
    if (attachments && Array.isArray(attachments)) {
      for (const attachment of attachments) {
        // Check if it's a resume file (PDF, DOC, DOCX, TXT)
        const filename = attachment.filename || '';
        const isResume = filename.match(/\.(pdf|doc|docx|txt)$/i);
        
        if (isResume) {
          processedAttachments.push({
            filename,
            content: attachment.content,
            contentType: attachment.contentType || 'application/octet-stream',
            size: attachment.size || 0
          });
        }
      }
    }
    
    // Create parsed email object
    const parsedEmail = {
      from: from || '',
      to: to || '',
      subject: subject || '',
      body: text || html || '',
      attachments: processedAttachments,
      date: new Date()
    };
    
    // Process the email to create a customer if it has resume attachments
    const customer = await processIncomingEmail(parsedEmail);
    
    // Return success response
    res.status(200).json({
      success: true,
      message: customer ? 'Customer created from email' : 'Email processed successfully',
      customerId: customer?.id
    });
  } catch (error) {
    console.error('Error processing SendGrid webhook:', error);
    res.status(500).json({
      success: false,
      message: `Error processing webhook: ${(error as Error).message}`
    });
  }
};

/**
 * Handle incoming webhook from Twilio for SMS
 * This processes incoming SMS messages forwarded by Twilio
 * 
 * @param req The Express request object
 * @param res The Express response object
 */
export const handleTwilioSmsWebhook = async (req: Request, res: Response) => {
  try {
    console.log('Received Twilio SMS webhook');
    
    // Extract SMS data from the webhook payload
    const { From, Body, MessageSid } = req.body;
    
    // Log the incoming SMS
    console.log(`Received SMS from ${From}: ${Body}`);
    
    // Process the SMS (in a real implementation, you might want to store this in your database)
    // For now, we'll just acknowledge receipt
    
    // Return a TwiML response
    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Message>Thank you for your message. We'll get back to you soon.</Message>
      </Response>
    `);
  } catch (error) {
    console.error('Error processing Twilio SMS webhook:', error);
    
    // Even on error, return a 200 response to Twilio with an error message
    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Message>Sorry, we couldn't process your message. Please try again later.</Message>
      </Response>
    `);
  }
};

/**
 * Handle incoming webhook from Twilio for WhatsApp
 * This processes incoming WhatsApp messages forwarded by Twilio
 * 
 * @param req The Express request object
 * @param res The Express response object
 */
export const handleTwilioWhatsAppWebhook = async (req: Request, res: Response) => {
  try {
    console.log('Received Twilio WhatsApp webhook');
    
    // Extract WhatsApp data from the webhook payload
    const { From, Body, MessageSid } = req.body;
    
    // Log the incoming WhatsApp message
    console.log(`Received WhatsApp from ${From}: ${Body}`);
    
    // Process the WhatsApp message (in a real implementation, you might want to store this in your database)
    // For now, we'll just acknowledge receipt
    
    // Return a TwiML response
    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Message>Thank you for your WhatsApp message. We'll get back to you soon.</Message>
      </Response>
    `);
  } catch (error) {
    console.error('Error processing Twilio WhatsApp webhook:', error);
    
    // Even on error, return a 200 response to Twilio with an error message
    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Message>Sorry, we couldn't process your WhatsApp message. Please try again later.</Message>
      </Response>
    `);
  }
};