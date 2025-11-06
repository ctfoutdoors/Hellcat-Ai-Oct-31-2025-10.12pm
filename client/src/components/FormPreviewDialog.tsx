import React, { useState } from 'react';
import { X, Download, Eye, FileText } from 'lucide-react';

interface FormPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  formType: 'fedex' | 'ups' | 'usps';
  onDownload: (format: 'pdf' | 'docx') => void;
}

export function FormPreviewDialog({
  isOpen,
  onClose,
  formData,
  formType,
  onDownload,
}: FormPreviewDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx'>('pdf');

  if (!isOpen) return null;

  const carrierNames = {
    fedex: 'FedEx',
    ups: 'UPS',
    usps: 'USPS',
  };

  const renderFormPreview = () => {
    return (
      <div className="bg-white p-8 border border-gray-300 rounded-lg space-y-6">
        {/* Header */}
        <div className="border-b border-gray-300 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {carrierNames[formType]} Dispute Claim Form
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Case #{formData.caseNumber}
          </p>
        </div>

        {/* Claimant Information */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Claimant Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Company Name:</p>
              <p className="font-medium">{formData.companyName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Contact Name:</p>
              <p className="font-medium">{formData.contactName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Email:</p>
              <p className="font-medium">{formData.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Phone:</p>
              <p className="font-medium">{formData.phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Shipment Information */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Shipment Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Tracking Number:</p>
              <p className="font-medium">{formData.trackingId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Ship Date:</p>
              <p className="font-medium">
                {formData.shipDate ? new Date(formData.shipDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Service Type:</p>
              <p className="font-medium">{formData.serviceType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Package Weight:</p>
              <p className="font-medium">{formData.weight || 'N/A'} lbs</p>
            </div>
          </div>
        </div>

        {/* Claim Details */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Claim Details
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Claim Type:</p>
              <p className="font-medium">{formData.caseType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Claimed Amount:</p>
              <p className="font-medium text-green-600">
                ${formData.claimedAmount?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600">Reason for Claim:</p>
              <p className="font-medium">{formData.reason || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600">Description:</p>
              <p className="font-medium whitespace-pre-wrap">
                {formData.description || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Recipient Information */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Recipient Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Name:</p>
              <p className="font-medium">{formData.recipientName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Email:</p>
              <p className="font-medium">{formData.recipientEmail || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600">Address:</p>
              <p className="font-medium">{formData.recipientAddress || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 text-xs text-gray-500">
          <p>Generated on {new Date().toLocaleDateString()}</p>
          <p className="mt-1">
            This form will be submitted to {carrierNames[formType]} for processing.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Form Preview</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {renderFormPreview()}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="format"
                value="pdf"
                checked={selectedFormat === 'pdf'}
                onChange={() => setSelectedFormat('pdf')}
                className="w-4 h-4 text-blue-600"
              />
              <FileText className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-gray-700">PDF</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="format"
                value="docx"
                checked={selectedFormat === 'docx'}
                onChange={() => setSelectedFormat('docx')}
                className="w-4 h-4 text-blue-600"
              />
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Word (DOCX)</span>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onDownload(selectedFormat)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download {selectedFormat.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
