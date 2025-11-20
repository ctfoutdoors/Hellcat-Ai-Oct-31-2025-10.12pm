// Test script to send a test email demonstrating tracking and evidence storage
import { sendEmailViaGmail } from './server/integrations/gmail-send.js';
import { logEmailActivity } from './server/services/emailActivityLogger.js';
import { backupToGoogleDrive } from './server/services/googleDriveBackup.js';

const testCaseId = 999; // Dummy case ID for testing

const emailData = {
  to: 'herve@catchthefever.com',
  subject: 'TEST: Carrier Dispute Follow-up - UPS Late Delivery',
  body: `
Dear UPS Claims Department,

This is a TEST EMAIL to demonstrate the email tracking, activity logging, and evidence storage system.

Case Details:
- Case ID: TEST-${testCaseId}
- Tracking Number: 1Z999AA10123456784
- Issue: Package delivered 5 days late
- Claim Amount: $150.00

This email demonstrates:
✅ Automatic email activity logging
✅ Evidence storage in S3
✅ Google Drive backup
✅ Case-specific tracking

All email communications are automatically tracked and stored as evidence for dispute documentation.

Best regards,
Hellcat Intelligence Platform
(Automated Test Email)
  `.trim(),
};

console.log('🚀 Sending test email...');
console.log('To:', emailData.to);
console.log('Subject:', emailData.subject);

try {
  // Send email
  const result = await sendEmailViaGmail(emailData);
  console.log('✅ Email sent successfully!');
  console.log('Message ID:', result.messageId);
  
  // Log activity
  console.log('\n📝 Logging email activity...');
  const activityResult = await logEmailActivity({
    caseId: testCaseId,
    type: 'sent',
    subject: emailData.subject,
    to: emailData.to,
    body: emailData.body,
    messageId: result.messageId,
  });
  console.log('✅ Activity logged:', activityResult);
  
  // Backup to Google Drive
  console.log('\n☁️  Backing up to Google Drive...');
  const backupResult = await backupToGoogleDrive({
    caseId: testCaseId,
    emailData: {
      ...emailData,
      messageId: result.messageId,
      sentAt: new Date().toISOString(),
    },
    type: 'sent',
  });
  console.log('✅ Backed up to Google Drive:', backupResult);
  
  console.log('\n🎉 Test email complete! Check your inbox at herve@catchthefever.com');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error);
}
