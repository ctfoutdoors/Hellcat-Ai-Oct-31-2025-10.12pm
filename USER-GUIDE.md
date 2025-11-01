# Carrier Dispute System - User Guide

## Overview

The Carrier Dispute System is a comprehensive platform for managing dimensional weight disputes with shipping carriers (FedEx, UPS, USPS, DHL). The system automates case creation, evidence gathering, dispute letter generation, and tracking of resolution outcomes.

## Getting Started

### Logging In

Access the system at your deployment URL and log in with your Google account. The system uses OAuth authentication for secure access.

### Dashboard Overview

The dashboard provides an at-a-glance view of your dispute portfolio:

- **Total Claimed**: Total amount disputed across all cases
- **Total Recovered**: Successfully recovered amounts
- **Open Exposure**: Pending dispute amounts
- **Success Rate**: Percentage of resolved cases

Charts show case status distribution, top carriers by claims, monthly trends, and recent activity.

## Managing Cases

### Creating a New Case

**Manual Creation:**
1. Click "+ New Case" in the header
2. Fill in required fields:
   - Tracking number
   - Carrier (FedEx, UPS, USPS, DHL)
   - Dispute amount
   - Product dimensions
   - Recipient information
3. Upload supporting documents (invoice, delivery photo, etc.)
4. Click "Create Case"

**Automatic Creation:**
The system can automatically create cases through:
- **ShipStation Sync**: Daily automatic detection of dimensional weight adjustments
- **Email Import**: Forward carrier adjustment emails to the system
- **PDF Invoice Scanner**: Upload carrier invoices for automatic extraction

### Viewing and Editing Cases

Click on any case card to view full details. From the case detail page you can:

- Edit case information
- Add or remove attachments
- Update status and priority
- Add notes and comments
- Generate dispute forms
- Build evidence packages
- Create AI-powered dispute letters

### Case Statuses

- **Draft**: Initial state, case is being prepared
- **Review**: Case is ready for review before submission
- **Submitted**: Dispute has been submitted to carrier
- **Pending**: Waiting for carrier response
- **Approved**: Carrier approved the dispute
- **Rejected**: Carrier rejected the dispute
- **Closed**: Case is closed (resolved or abandoned)

### Priority Levels

The system uses AI to suggest priority levels based on:
- Dispute amount (higher = higher priority)
- Carrier history (poor resolution rate = higher priority)
- Case age (older = higher priority)
- Deadline proximity (closer = urgent)

Priorities: **Low**, **Medium**, **High**, **Urgent**

## Search and Filtering

### Advanced Search

Use the search bar in the header to quickly find cases by tracking number, recipient name, or case number.

### Filters

Apply multiple filters simultaneously:
- **Carrier**: FedEx, UPS, USPS, DHL
- **Status**: Draft, Review, Submitted, etc.
- **Priority**: Low, Medium, High, Urgent
- **Date Range**: Filter by creation date or ship date
- **Amount Range**: Filter by dispute amount
- **Shipper/Recipient**: Filter by name or zip code

Click filter chips to remove individual filters, or use "Clear All Filters" to reset.

## Bulk Actions

Select multiple cases using checkboxes to perform bulk operations:

1. Check boxes next to cases you want to update
2. Click "Select All" to select all visible cases
3. Choose bulk action from the menu:
   - Update Status
   - Update Priority
   - Assign to User
   - Add Tags
   - Export to CSV
   - Delete Cases

## Automation Features

### ShipStation Integration

**Setup:**
1. Go to Settings → Integrations
2. Enter your ShipStation API credentials
3. Configure sync frequency (default: daily at 2 AM)

**Features:**
- Automatic daily sync of shipments
- Detection of dimensional weight adjustments
- Auto-creation of draft cases for discrepancies > 10%
- Email notifications for new cases
- Sync history and logs

### PDF Invoice Scanner

Upload carrier invoices to automatically extract:
- Tracking numbers
- Charges and fees
- Dimensional weight adjustments
- Package dimensions

**Usage:**
1. Go to Monitoring → PDF Scanner
2. Drag and drop PDF files or click to browse
3. System extracts data using OCR
4. Review extracted information
5. Create cases from suspicious charges

### Email-to-Case Import

Forward carrier adjustment emails to automatically create cases:

1. Get your unique email forwarding address from Settings → Integrations
2. Forward carrier emails to that address
3. System uses AI to extract:
   - Tracking number
   - Dispute amount
   - Dimensions
   - Reason for adjustment
4. Case is created with "Review" status
5. Original email is attached as evidence

### Auto-Status Updates

The system monitors your email inbox for carrier responses and automatically updates case statuses:

- Approval emails → Status changes to "Approved"
- Rejection emails → Status changes to "Rejected"
- Request for information → Status changes to "Pending"
- Email notifications sent for all status changes

## Evidence Management

### Evidence Package Builder

Automatically gather all evidence for a case into a professional ZIP package:

**Included Documents:**
- Cover letter with case summary
- Manufacturer certification (if available)
- ShipStation order record
- 3PL verification documents
- Delivery photos
- Original invoice
- Evidence index (Appendix A, B, C, etc.)

**Usage:**
1. Open case detail page
2. Click "Build Evidence Package"
3. System gathers all documents
4. Downloads ZIP file with proper naming

### Manufacturer Certifications

Store official product certifications from manufacturers:

1. Go to Data → Certifications
2. Add certification with:
   - Product name and SKU
   - Manufacturer name
   - Certified dimensions (length × width × height)
   - Shape (cylindrical, rectangular, etc.)
   - Certification date and expiration
   - 3PL provider information

Certifications are automatically included in dispute letters and evidence packages.

## Dispute Letter Generation

### AI-Powered Letter Writer

Generate professional dispute letters automatically:

**Features:**
- Pulls data from case, certifications, and knowledge base
- Includes evidence references (Appendix A, B, C)
- Carrier-specific formatting
- Multiple tone options: Professional, Firm, Escalated
- Includes legal language and deadline requirements

**Usage:**
1. Open case detail page
2. Click "Generate Dispute Letter"
3. Select tone and options
4. Review generated letter
5. Edit if needed
6. Download as PDF or Word document

### Form Generator

Generate carrier-specific dispute forms pre-filled with case data:

**Supported Carriers:**
- FedEx Dimensional Weight Dispute Form
- UPS Billing Dispute Form
- USPS Claims Form
- Generic Carrier Dispute Form

**Formats:**
- PDF (for printing and mailing)
- Word (.docx) (for editing)

## Reports and Analytics

### Dashboard Analytics

View key metrics and trends:
- Case status distribution
- Top carriers by claim volume and amount
- Monthly trends (cases filed vs. amounts recovered)
- Success rates by carrier

### Weekly Reports

Automatically generated weekly summary reports:
- New cases created
- Cases resolved
- Total recovered amounts
- Outstanding disputes
- Upcoming deadlines

### Performance Metrics

Track system and team performance:
- Average resolution time
- Success rate by carrier
- Recovery rate ($ recovered / $ claimed)
- Case volume trends
- Priority distribution

## Settings and Customization

### Theme Customization

Personalize the interface:

1. Go to Settings → Theme Colors
2. Customize colors:
   - Primary color
   - Secondary color
   - Accent color
3. Changes apply immediately
4. Reset to defaults anytime

### Email Template Customization

Brand your email notifications:

1. Go to Settings → Email Templates
2. Customize:
   - Company name and logo
   - Header text and colors
   - Email content and footer
   - Button text and colors
3. Preview changes
4. Send test email
5. Save settings

### Density Settings

Choose information density level:
- **Compact**: Minimal spacing, maximum data per screen
- **Normal**: Balanced spacing and readability
- **Detailed**: Generous spacing, focus on individual items

Toggle density from the header menu or Settings.

### Notification Preferences

Configure which notifications you receive:
- New case created
- Status changes
- Bulk operation completion
- Sync completion
- Email delivery

## AI Agent Integration

The AI agent can interact with the entire system:

**Capabilities:**
- Create and update cases
- Generate dispute letters
- Build evidence packages
- Trigger ShipStation syncs
- Send emails
- Update statuses
- Search and filter cases

**Usage:**
Simply describe what you want in natural language, and the AI agent will execute the actions.

## Mobile Access

The system is fully responsive and works on all devices:

- **Mobile phones**: Optimized touch interface, collapsible menus
- **Tablets**: Adaptive layouts, touch-friendly controls
- **Desktop**: Full feature set, keyboard shortcuts

## Tips and Best Practices

### For Maximum Efficiency

1. **Enable ShipStation Sync**: Automate case creation for all adjustments
2. **Use Email Forwarding**: Forward all carrier emails for automatic processing
3. **Maintain Certifications**: Keep manufacturer certifications up to date
4. **Use Bulk Actions**: Update multiple cases at once
5. **Set Up Email Notifications**: Stay informed of status changes
6. **Use Smart Priority**: Let AI suggest priorities based on data

### For Best Results

1. **Upload All Evidence**: More evidence = higher success rate
2. **Use AI Dispute Letters**: Professional, data-driven arguments
3. **Include Certifications**: Official documentation is powerful
4. **Follow Up Promptly**: Monitor pending cases and respond quickly
5. **Track Patterns**: Use analytics to identify problematic carriers
6. **Document Everything**: Add notes and comments to cases

## Troubleshooting

### Common Issues

**Cases not syncing from ShipStation:**
- Check API credentials in Settings → Integrations
- Verify sync scheduler is enabled
- Check Sync Status dashboard for errors

**Email notifications not sending:**
- Verify SMTP settings in Settings → Email Templates
- Check spam folder
- Send test email to verify configuration

**PDF upload not working:**
- Ensure file size is under 10MB
- Verify PDF is not password-protected
- Try a different browser

**Search not returning results:**
- Clear all filters and try again
- Check spelling of search terms
- Try searching by tracking number only

### Getting Help

For technical support or questions:
1. Check this user guide
2. Review the FAQ section
3. Contact support at https://help.manus.im

## Keyboard Shortcuts

- `Ctrl/Cmd + K`: Global search
- `Ctrl/Cmd + N`: New case
- `Ctrl/Cmd + S`: Save changes
- `Esc`: Close modals
- `D`: Toggle density
- `/`: Focus search

## System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- JavaScript enabled
- Cookies enabled for authentication

## Data Security

- All data encrypted in transit (HTTPS)
- OAuth authentication
- Role-based access control
- Regular automated backups
- SOC 2 compliant infrastructure

---

**Version:** 1.0.0  
**Last Updated:** October 30, 2025  
**Support:** https://help.manus.im
