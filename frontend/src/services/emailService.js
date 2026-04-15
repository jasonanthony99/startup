import emailjs from '@emailjs/browser';

// ═══════════════════════════════════════════════════════════════════
//  EmailJS Configuration
//  Sign up at https://www.emailjs.com/ and fill in your credentials:
//  1. Create a Service (e.g., Gmail) → copy Service ID
//  2. Create a Template → copy Template ID
//  3. Get your Public Key from Account → General
// ═══════════════════════════════════════════════════════════════════

const EMAILJS_SERVICE_ID = 'service_fgmsu2d';
const EMAILJS_TEMPLATE_ID = 'template_s8k0rh1';
const EMAILJS_PUBLIC_KEY = '9n67GOF10ibS1qRie';

/**
 * Send a document-ready notification email to a resident.
 * 
 * EmailJS Template Variables (set these in your template):
 *   {{to_name}}       - Resident's name
 *   {{to_email}}      - Resident's email
 *   {{document_name}} - e.g., "Barangay Clearance"
 *   {{reference_id}}  - e.g., "DOC-1-20260416-ABC123"
 *   {{pickup_date}}   - e.g., "Apr 20, 2026"
 *   {{remarks}}       - Admin remarks (optional)
 *   {{status}}        - e.g., "Ready for Pickup"
 */
export const sendDocumentStatusEmail = async ({
  toName,
  toEmail,
  documentName,
  referenceId,
  status,
  pickupDate = '',
  remarks = '',
}) => {
  try {
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_name: toName,
        to_email: toEmail,
        document_name: documentName,
        reference_id: referenceId,
        status: status,
        pickup_date: pickupDate || 'To be announced',
        remarks: remarks || 'N/A',
      },
      EMAILJS_PUBLIC_KEY
    );
    console.log('Email sent successfully:', result.text);
    return { success: true, result };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
};
