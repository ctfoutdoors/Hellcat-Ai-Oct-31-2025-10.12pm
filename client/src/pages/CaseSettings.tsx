import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { GlassCard } from '@/components/trading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import RichTextEditor from '@/components/RichTextEditor';
import AIWritingAssistant from '@/components/AIWritingAssistant';
import {
  FileText,
  Plus,
  Save,
  Copy,
  Trash2,
  Search,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Case Settings - Template Management
 * 
 * Features:
 * - Split-screen editor
 * - Lifecycle stage templates
 * - Field insertion sidebar
 * - Template preview
 * - Trading platform aesthetics
 */

const LIFECYCLE_STAGES = [
  {
    id: 1,
    name: 'Initial Dispute',
    description: 'First letter to carrier reporting the issue',
    color: 'text-trading-blue-400',
  },
  {
    id: 2,
    name: 'Follow-up Request',
    description: 'Second letter requesting update on claim',
    color: 'text-trading-amber-400',
  },
  {
    id: 3,
    name: 'Escalation Notice',
    description: 'Escalated letter to management or legal',
    color: 'text-trading-orange-400',
  },
  {
    id: 4,
    name: 'Final Demand',
    description: 'Final notice before legal action',
    color: 'text-trading-red-400',
  },
  {
    id: 5,
    name: 'Resolution Confirmation',
    description: 'Confirmation of settlement or resolution',
    color: 'text-trading-green-400',
  },
];

const AVAILABLE_FIELDS = {
  customer: [
    { key: 'customerName', label: 'Customer Name', example: 'John Smith' },
    { key: 'customerEmail', label: 'Customer Email', example: 'john@example.com' },
    { key: 'customerPhone', label: 'Customer Phone', example: '(555) 123-4567' },
    { key: 'customerAddress', label: 'Customer Address', example: '123 Main St, City, ST 12345' },
  ],
  order: [
    { key: 'trackingNumber', label: 'Tracking Number', example: '1Z999AA10123456784' },
    { key: 'carrier', label: 'Carrier', example: 'FedEx' },
    { key: 'serviceType', label: 'Service Type', example: 'Ground' },
    { key: 'orderValue', label: 'Order Value', example: '$150.00' },
    { key: 'orderDate', label: 'Order Date', example: 'January 15, 2025' },
    { key: 'deliveryDate', label: 'Delivery Date', example: 'January 20, 2025' },
  ],
  case: [
    { key: 'caseId', label: 'Case ID', example: 'CASE-2025-001' },
    { key: 'caseStatus', label: 'Case Status', example: 'Filed' },
    { key: 'casePriority', label: 'Case Priority', example: 'High' },
    { key: 'caseCreatedDate', label: 'Case Created Date', example: 'January 21, 2025' },
    { key: 'claimAmount', label: 'Claim Amount', example: '$150.00' },
  ],
  damage: [
    { key: 'damageType', label: 'Damage Type', example: 'Broken Rod' },
    { key: 'damageSeverity', label: 'Damage Severity', example: 'Severe' },
    { key: 'damageDescription', label: 'Damage Description', example: 'Rod snapped in half during transit' },
  ],
  company: [
    { key: 'companyName', label: 'Company Name', example: 'Catch The Fever' },
    { key: 'companyAddress', label: 'Company Address', example: '456 Business Blvd, City, ST 12345' },
    { key: 'companyPhone', label: 'Company Phone', example: '(555) 987-6543' },
    { key: 'companyEmail', label: 'Company Email', example: 'support@catchthefever.com' },
  ],
  other: [
    { key: 'currentDate', label: 'Current Date', example: 'October 31, 2025' },
    { key: 'todayDate', label: 'Today\'s Date', example: 'October 31, 2025' },
  ],
};

export default function CaseSettings() {
  const [selectedStage, setSelectedStage] = useState(1);
  const [templateName, setTemplateName] = useState('Initial Dispute Letter');
  const [templateContent, setTemplateContent] = useState(`
    <h1>Damage Claim Notification</h1>
    <p>Date: {{currentDate}}</p>
    <p>To: {{carrier}} Claims Department</p>
    <p>From: {{companyName}}</p>
    <p>Re: Damage Claim for Tracking Number {{trackingNumber}}</p>
    
    <p>Dear Claims Department,</p>
    
    <p>We are writing to file a formal damage claim for a shipment delivered on {{deliveryDate}}. The package, tracked under {{trackingNumber}}, arrived with significant damage to the contents.</p>
    
    <h2>Shipment Details:</h2>
    <ul>
      <li>Tracking Number: {{trackingNumber}}</li>
      <li>Service Type: {{serviceType}}</li>
      <li>Declared Value: {{orderValue}}</li>
      <li>Delivery Date: {{deliveryDate}}</li>
    </ul>
    
    <h2>Damage Details:</h2>
    <ul>
      <li>Type: {{damageType}}</li>
      <li>Severity: {{damageSeverity}}</li>
      <li>Description: {{damageDescription}}</li>
    </ul>
    
    <p>We request full reimbursement of {{claimAmount}} for the damaged merchandise. All supporting documentation, including photos and receipts, are attached to this claim.</p>
    
    <p>Please acknowledge receipt of this claim and provide a claim number for our records. We expect a response within 10 business days as per your published claims policy.</p>
    
    <p>Sincerely,</p>
    <p>{{companyName}}<br/>
    {{companyAddress}}<br/>
    {{companyPhone}}<br/>
    {{companyEmail}}</p>
  `);
  const [searchField, setSearchField] = useState('');

  const insertField = (fieldKey: string) => {
    const fieldSyntax = `{{${fieldKey}}}`;
    // Insert at cursor position in editor
    setTemplateContent((prev) => prev + ` ${fieldSyntax}`);
    toast.success(`Field ${fieldKey} inserted`);
  };

  const saveTemplate = () => {
    toast.success('Template saved successfully');
  };

  const duplicateTemplate = () => {
    toast.success('Template duplicated');
  };

  const deleteTemplate = () => {
    if (confirm('Delete this template?')) {
      toast.success('Template deleted');
    }
  };

  const filteredFields = Object.entries(AVAILABLE_FIELDS).reduce((acc, [category, fields]) => {
    const filtered = fields.filter(
      (field) =>
        field.label.toLowerCase().includes(searchField.toLowerCase()) ||
        field.key.toLowerCase().includes(searchField.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as typeof AVAILABLE_FIELDS);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background grid-pattern">
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Case Settings
            </h1>
            <p className="text-trading-navy-300">
              Manage dispute letter templates for each lifecycle stage
            </p>
          </div>

          {/* Progress Bar */}
          <GlassCard className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Dispute Lifecycle</h3>
            <div className="relative">
              <div className="flex justify-between mb-2">
                {LIFECYCLE_STAGES.map((stage, index) => (
                  <div
                    key={stage.id}
                    className={`flex flex-col items-center flex-1 cursor-pointer ${
                      selectedStage === stage.id ? 'opacity-100' : 'opacity-60'
                    }`}
                    onClick={() => setSelectedStage(stage.id)}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        selectedStage === stage.id
                          ? 'gradient-blue glow-blue'
                          : selectedStage > stage.id
                          ? 'bg-trading-green-500'
                          : 'bg-trading-navy-700'
                      }`}
                    >
                      {selectedStage > stage.id ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-sm font-mono">{stage.id}</span>
                      )}
                    </div>
                    <span className={`text-xs text-center ${stage.color}`}>
                      {stage.name}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-1 bg-trading-navy-800 rounded-full overflow-hidden">
                <div
                  className="h-full gradient-blue transition-all duration-500"
                  style={{ width: `${(selectedStage / LIFECYCLE_STAGES.length) * 100}%` }}
                />
              </div>
            </div>
          </GlassCard>

          {/* Split-Screen Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Template List */}
            <div className="lg:col-span-1">
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Templates</h3>
                  <Button size="sm" className="gradient-blue">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {LIFECYCLE_STAGES.map((stage) => (
                    <div
                      key={stage.id}
                      className={`p-3 rounded-lg cursor-pointer glass-hover ${
                        selectedStage === stage.id
                          ? 'bg-trading-blue-500/20 border border-trading-blue-500'
                          : 'border border-trading-navy-700'
                      }`}
                      onClick={() => setSelectedStage(stage.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-trading-blue-400" />
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {stage.name}
                            </div>
                            <div className="text-xs text-trading-navy-400">
                              Stage {stage.id}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-trading-navy-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* Center: Editor */}
            <div className="lg:col-span-1">
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <Label htmlFor="templateName" className="text-sm text-trading-navy-400">
                      Template Name
                    </Label>
                    <Input
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="glass mt-1"
                    />
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline" className="glass" onClick={duplicateTemplate}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="glass text-trading-red-400" onClick={deleteTemplate}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" className="gradient-blue" onClick={saveTemplate}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>

                <RichTextEditor
                  content={templateContent}
                  onChange={setTemplateContent}
                  placeholder="Start typing your template..."
                />
              </GlassCard>
            </div>

            {/* Right: Fields Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* AI Writing Assistant */}
              <AIWritingAssistant
                currentContent={templateContent}
                onInsertContent={(content) => setTemplateContent(content)}
                caseDetails={{
                  carrier: 'FedEx',
                  trackingNumber: '1Z999AA10123456784',
                  damageType: 'Broken Rod',
                  claimAmount: 15000,
                }}
              />

              {/* Available Fields */}
              <GlassCard>
                <h3 className="text-lg font-semibold mb-4">Available Fields</h3>
                
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-trading-navy-400" />
                    <Input
                      placeholder="Search fields..."
                      value={searchField}
                      onChange={(e) => setSearchField(e.target.value)}
                      className="glass pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {Object.entries(filteredFields).map(([category, fields]) => (
                    <div key={category}>
                      <div className="text-xs font-semibold text-trading-navy-400 uppercase mb-2">
                        {category}
                      </div>
                      <div className="space-y-2">
                        {fields.map((field) => (
                          <div
                            key={field.key}
                            className="p-2 rounded-lg glass-hover cursor-pointer border border-trading-navy-700"
                            onClick={() => insertField(field.key)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-foreground">
                                {field.label}
                              </span>
                              <Badge variant="outline" className="text-xs font-mono">
                                {`{{${field.key}}}`}
                              </Badge>
                            </div>
                            <div className="text-xs text-trading-navy-400">
                              {field.example}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
