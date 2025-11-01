/**
 * Weekly Reports Service
 * Auto-generates and emails weekly performance reports
 */

import * as db from '../db';
import { sendEmailSMTP } from './emailService';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface WeeklyReportData {
  weekStart: Date;
  weekEnd: Date;
  totalCases: number;
  newCases: number;
  resolvedCases: number;
  totalClaimed: number;
  totalRecovered: number;
  successRate: number;
  carrierBreakdown: {
    carrier: string;
    cases: number;
    claimed: number;
    recovered: number;
  }[];
  statusBreakdown: {
    status: string;
    count: number;
  }[];
  topCases: any[];
}

export class WeeklyReportsService {
  /**
   * Generate weekly report data
   */
  static async generateReportData(weekStart: Date, weekEnd: Date): Promise<WeeklyReportData> {
    const allCases = await db.getAllCases();
    
    // Filter cases for the week
    const weekCases = allCases.filter(c => {
      const createdAt = new Date(c.createdAt);
      return createdAt >= weekStart && createdAt <= weekEnd;
    });

    // Calculate metrics
    const totalCases = allCases.length;
    const newCases = weekCases.length;
    const resolvedCases = weekCases.filter(c => c.status === 'RESOLVED').length;
    
    const totalClaimed = allCases.reduce((sum, c) => sum + (c.claimedAmount || 0), 0);
    const totalRecovered = allCases.reduce((sum, c) => sum + (c.recoveredAmount || 0), 0);
    
    const successRate = totalCases > 0 
      ? (allCases.filter(c => c.status === 'RESOLVED').length / totalCases) * 100 
      : 0;

    // Carrier breakdown
    const carrierMap = new Map<string, { cases: number; claimed: number; recovered: number }>();
    
    for (const c of allCases) {
      const carrier = c.carrier || 'UNKNOWN';
      const existing = carrierMap.get(carrier) || { cases: 0, claimed: 0, recovered: 0 };
      
      carrierMap.set(carrier, {
        cases: existing.cases + 1,
        claimed: existing.claimed + (c.claimedAmount || 0),
        recovered: existing.recovered + (c.recoveredAmount || 0),
      });
    }

    const carrierBreakdown = Array.from(carrierMap.entries())
      .map(([carrier, data]) => ({ carrier, ...data }))
      .sort((a, b) => b.cases - a.cases);

    // Status breakdown
    const statusMap = new Map<string, number>();
    
    for (const c of allCases) {
      const status = c.status || 'UNKNOWN';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    }

    const statusBreakdown = Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // Top cases by claimed amount
    const topCases = allCases
      .filter(c => c.claimedAmount && c.claimedAmount > 0)
      .sort((a, b) => (b.claimedAmount || 0) - (a.claimedAmount || 0))
      .slice(0, 5);

    return {
      weekStart,
      weekEnd,
      totalCases,
      newCases,
      resolvedCases,
      totalClaimed,
      totalRecovered,
      successRate,
      carrierBreakdown,
      statusBreakdown,
      topCases,
    };
  }

  /**
   * Generate PDF report
   */
  static async generatePDFReport(reportData: WeeklyReportData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = 750;

    // Title
    page.drawText('Weekly Carrier Dispute Report', {
      x: 50,
      y: yPosition,
      size: 24,
      font: boldFont,
      color: rgb(0.2, 0.4, 0.6),
    });

    yPosition -= 30;

    // Date range
    page.drawText(
      `${reportData.weekStart.toLocaleDateString()} - ${reportData.weekEnd.toLocaleDateString()}`,
      {
        x: 50,
        y: yPosition,
        size: 12,
        font,
        color: rgb(0.4, 0.4, 0.4),
      }
    );

    yPosition -= 40;

    // Summary metrics
    page.drawText('Summary', {
      x: 50,
      y: yPosition,
      size: 18,
      font: boldFont,
    });

    yPosition -= 25;

    const metrics = [
      `Total Cases: ${reportData.totalCases}`,
      `New This Week: ${reportData.newCases}`,
      `Resolved This Week: ${reportData.resolvedCases}`,
      `Total Claimed: $${(reportData.totalClaimed / 100).toFixed(2)}`,
      `Total Recovered: $${(reportData.totalRecovered / 100).toFixed(2)}`,
      `Success Rate: ${reportData.successRate.toFixed(1)}%`,
    ];

    for (const metric of metrics) {
      page.drawText(metric, {
        x: 70,
        y: yPosition,
        size: 12,
        font,
      });
      yPosition -= 20;
    }

    yPosition -= 20;

    // Carrier breakdown
    page.drawText('Carrier Breakdown', {
      x: 50,
      y: yPosition,
      size: 18,
      font: boldFont,
    });

    yPosition -= 25;

    for (const carrier of reportData.carrierBreakdown.slice(0, 5)) {
      page.drawText(
        `${carrier.carrier}: ${carrier.cases} cases, $${(carrier.claimed / 100).toFixed(2)} claimed`,
        {
          x: 70,
          y: yPosition,
          size: 11,
          font,
        }
      );
      yPosition -= 18;
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Generate HTML report
   */
  static generateHTMLReport(reportData: WeeklyReportData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #2c5282; }
          h2 { color: #4a5568; margin-top: 30px; }
          .metric { background: #f7fafc; padding: 15px; margin: 10px 0; border-left: 4px solid #4299e1; }
          .metric-label { font-weight: bold; color: #2d3748; }
          .metric-value { font-size: 24px; color: #2c5282; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #edf2f7; font-weight: bold; }
          .success { color: #38a169; }
          .warning { color: #ed8936; }
        </style>
      </head>
      <body>
        <h1>Weekly Carrier Dispute Report</h1>
        <p>${reportData.weekStart.toLocaleDateString()} - ${reportData.weekEnd.toLocaleDateString()}</p>

        <h2>Summary</h2>
        <div class="metric">
          <div class="metric-label">Total Cases</div>
          <div class="metric-value">${reportData.totalCases}</div>
        </div>
        <div class="metric">
          <div class="metric-label">New This Week</div>
          <div class="metric-value">${reportData.newCases}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Resolved This Week</div>
          <div class="metric-value">${reportData.resolvedCases}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Total Claimed</div>
          <div class="metric-value">$${(reportData.totalClaimed / 100).toFixed(2)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Total Recovered</div>
          <div class="metric-value class="success">$${(reportData.totalRecovered / 100).toFixed(2)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Success Rate</div>
          <div class="metric-value ${reportData.successRate >= 50 ? 'success' : 'warning'}">
            ${reportData.successRate.toFixed(1)}%
          </div>
        </div>

        <h2>Carrier Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Carrier</th>
              <th>Cases</th>
              <th>Claimed</th>
              <th>Recovered</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.carrierBreakdown.map(c => `
              <tr>
                <td>${c.carrier}</td>
                <td>${c.cases}</td>
                <td>$${(c.claimed / 100).toFixed(2)}</td>
                <td>$${(c.recovered / 100).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Status Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.statusBreakdown.map(s => `
              <tr>
                <td>${s.status}</td>
                <td>${s.count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Top Cases</h2>
        <table>
          <thead>
            <tr>
              <th>Case Number</th>
              <th>Carrier</th>
              <th>Claimed Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.topCases.map(c => `
              <tr>
                <td>${c.caseNumber}</td>
                <td>${c.carrier}</td>
                <td>$${(c.claimedAmount / 100).toFixed(2)}</td>
                <td>${c.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Send weekly report via email
   */
  static async sendWeeklyReport(recipientEmail: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Calculate last week's date range
      const today = new Date();
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - today.getDay()); // Last Sunday
      
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 7);

      // Generate report data
      const reportData = await this.generateReportData(weekStart, weekEnd);

      // Generate HTML
      const htmlContent = this.generateHTMLReport(reportData);

      // Generate PDF
      const pdfBuffer = await this.generatePDFReport(reportData);

      // Send email
      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      };

      await sendEmailSMTP(smtpConfig, {
        from: process.env.SMTP_FROM || 'noreply@catchthefever.com',
        to: recipientEmail,
        subject: `Weekly Carrier Dispute Report - ${weekStart.toLocaleDateString()}`,
        html: htmlContent,
        attachments: [
          {
            filename: `weekly-report-${weekStart.toISOString().split('T')[0]}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      return { success: true };
    } catch (error: any) {
      console.error('Failed to send weekly report:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Schedule automatic weekly report delivery
   * This should be called from a cron job or scheduler
   */
  static async scheduleWeeklyReportDelivery(recipientEmails: string[]): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    errors: string[];
  }> {
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const email of recipientEmails) {
      try {
        const result = await this.sendWeeklyReport(email);
        if (result.success) {
          sent++;
        } else {
          failed++;
          errors.push(`${email}: ${result.error}`);
        }
      } catch (error: any) {
        failed++;
        errors.push(`${email}: ${error.message}`);
      }
    }

    return {
      success: failed === 0,
      sent,
      failed,
      errors,
    };
  }

  /**
   * Get default recipient emails from environment or database
   */
  static async getDefaultRecipients(): Promise<string[]> {
    // Check environment variable first
    const envRecipients = process.env.WEEKLY_REPORT_RECIPIENTS;
    if (envRecipients) {
      return envRecipients.split(',').map(email => email.trim());
    }

    // Fallback to owner email
    const ownerEmail = process.env.OWNER_EMAIL;
    if (ownerEmail) {
      return [ownerEmail];
    }

    return [];
  }
}
