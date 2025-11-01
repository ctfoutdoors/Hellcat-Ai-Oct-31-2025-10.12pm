import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ExportData {
  [key: string]: any;
}

export class ExportService {
  /**
   * Export data to CSV format
   */
  static exportToCSV(data: ExportData[], filename: string = 'export.csv') {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, filename);
  }

  /**
   * Export data to Excel format with formatting
   */
  static exportToExcel(data: ExportData[], filename: string = 'export.xlsx', sheetName: string = 'Sheet1') {
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    const maxWidth = 50;
    const colWidths = Object.keys(data[0] || {}).map((key) => {
      const maxLength = Math.max(
        key.length,
        ...data.map((row) => String(row[key] || '').length)
      );
      return { wch: Math.min(maxLength + 2, maxWidth) };
    });
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel file
    XLSX.writeFile(workbook, filename);
  }

  /**
   * Export data to Excel with multiple sheets
   */
  static exportToExcelMultiSheet(
    sheets: Array<{ name: string; data: ExportData[] }>,
    filename: string = 'export.xlsx'
  ) {
    const workbook = XLSX.utils.book_new();

    sheets.forEach(({ name, data }) => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Auto-size columns
      const maxWidth = 50;
      const colWidths = Object.keys(data[0] || {}).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...data.map((row) => String(row[key] || '').length)
        );
        return { wch: Math.min(maxLength + 2, maxWidth) };
      });
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, name);
    });

    XLSX.writeFile(workbook, filename);
  }

  /**
   * Export cases data with formatting
   */
  static exportCases(cases: any[], format: 'csv' | 'excel' = 'csv') {
    const exportData = cases.map((c) => ({
      'Case Number': c.caseNumber,
      'Status': c.status,
      'Priority': c.priority,
      'Case Type': c.caseType || 'N/A',
      'Carrier': c.carrier,
      'Tracking ID': c.trackingId || 'N/A',
      'Order Number': c.orderNumber || 'N/A',
      'Recipient Name': c.recipientName || 'N/A',
      'Recipient Email': c.recipientEmail || 'N/A',
      'Recipient Phone': c.recipientPhone || 'N/A',
      'Original Amount': `$${c.originalAmount?.toFixed(2) || '0.00'}`,
      'Adjusted Amount': `$${c.adjustedAmount?.toFixed(2) || '0.00'}`,
      'Claimed Amount': `$${c.claimedAmount?.toFixed(2) || '0.00'}`,
      'Recovered Amount': `$${c.recoveredAmount?.toFixed(2) || '0.00'}`,
      'Created Date': new Date(c.createdAt).toLocaleDateString(),
      'Updated Date': new Date(c.updatedAt).toLocaleDateString(),
    }));

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `cases-export-${timestamp}.${format === 'csv' ? 'csv' : 'xlsx'}`;

    if (format === 'csv') {
      this.exportToCSV(exportData, filename);
    } else {
      this.exportToExcel(exportData, filename, 'Cases');
    }
  }

  /**
   * Export dashboard report with multiple sheets
   */
  static exportDashboardReport(data: {
    cases: any[];
    summary: any;
    carrierStats: any[];
    statusStats: any[];
  }) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `dashboard-report-${timestamp}.xlsx`;

    // Prepare cases data
    const casesData = data.cases.map((c) => ({
      'Case Number': c.caseNumber,
      'Status': c.status,
      'Carrier': c.carrier,
      'Claimed': `$${c.claimedAmount?.toFixed(2) || '0.00'}`,
      'Recovered': `$${c.recoveredAmount?.toFixed(2) || '0.00'}`,
      'Created': new Date(c.createdAt).toLocaleDateString(),
    }));

    // Prepare summary data
    const summaryData = [
      { Metric: 'Total Cases', Value: data.summary.totalCases },
      { Metric: 'Total Claimed', Value: `$${data.summary.totalClaimed.toFixed(2)}` },
      { Metric: 'Total Recovered', Value: `$${data.summary.totalRecovered.toFixed(2)}` },
      { Metric: 'Success Rate', Value: `${data.summary.successRate.toFixed(1)}%` },
      { Metric: 'Open Exposure', Value: `$${data.summary.openExposure.toFixed(2)}` },
    ];

    // Prepare carrier stats
    const carrierData = data.carrierStats.map((c) => ({
      Carrier: c.carrier,
      'Total Cases': c.totalCases,
      'Resolved': c.resolved,
      'Rejected': c.rejected,
      'Pending': c.pending,
      'Total Claimed': `$${c.totalClaimed.toFixed(2)}`,
      'Total Recovered': `$${c.totalRecovered.toFixed(2)}`,
      'Success Rate': `${c.successRate.toFixed(1)}%`,
    }));

    // Prepare status stats
    const statusData = data.statusStats.map((s) => ({
      Status: s.status,
      Count: s.count,
      Percentage: `${((s.count / data.summary.totalCases) * 100).toFixed(1)}%`,
    }));

    this.exportToExcelMultiSheet(
      [
        { name: 'Summary', data: summaryData },
        { name: 'Cases', data: casesData },
        { name: 'By Carrier', data: carrierData },
        { name: 'By Status', data: statusData },
      ],
      filename
    );
  }

  /**
   * Helper method to download a file
   */
  private static downloadFile(blob: Blob, filename: string) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
