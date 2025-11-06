import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Mail,
  MoreVertical,
  Phone,
  MapPin,
  Package,
  DollarSign,
  Calendar,
  Truck,
  Download,
  Sparkles,
  CheckCircle2,
  Eye,
  Plus,
} from 'lucide-react';
import { Link } from 'wouter';
import { useDensity } from '@/contexts/DensityContext';

interface EnhancedCaseCardProps {
  caseData: any;
  onGenerateForm?: (caseId: number) => void;
  onAIReview?: (caseId: number) => void;
  onSelect?: (caseId: number, selected: boolean) => void;
  selected?: boolean;
}

export function EnhancedCaseCard({
  caseData,
  onGenerateForm,
  onAIReview,
  onSelect,
  selected,
}: EnhancedCaseCardProps) {
  const { density } = useDensity();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
      FILED: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      AWAITING_RESPONSE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      RESOLVED: 'bg-green-500/20 text-green-400 border-green-500/50',
      CLOSED: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
      REJECTED: 'bg-red-500/20 text-red-400 border-red-500/50',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/50';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      URGENT: 'bg-red-500/20 text-red-400 border-red-500/50 shadow-lg shadow-red-500/20',
    };
    return colors[priority] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  const getCarrierLogo = (carrier: string) => {
    const logos: Record<string, string> = {
      FEDEX: '🚚',
      UPS: '📦',
      USPS: '✉️',
      DHL: '🌐',
      ONTRAC: '🚛',
      LASERSHIP: '📮',
    };
    return logos[carrier] || '📦';
  };

  const getCarrierGradient = (carrier: string) => {
    const gradients: Record<string, string> = {
      FEDEX: 'from-purple-500 to-orange-500',
      UPS: 'from-yellow-600 to-amber-700',
      USPS: 'from-blue-600 to-blue-800',
      DHL: 'from-yellow-400 to-red-600',
      ONTRAC: 'from-green-500 to-teal-600',
      LASERSHIP: 'from-indigo-500 to-purple-600',
    };
    return gradients[carrier] || 'from-gray-500 to-gray-700';
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Density-specific padding and text sizes
  const cardPadding = {
    compact: 'p-3',
    normal: 'p-4',
    detailed: 'p-6',
  }[density];

  const textSize = {
    compact: 'text-xs',
    normal: 'text-sm',
    detailed: 'text-base',
  }[density];

  const titleSize = {
    compact: 'text-base',
    normal: 'text-lg',
    detailed: 'text-xl',
  }[density];

  return (
    <Card className={`${cardPadding} relative group transition-all hover:shadow-xl hover:shadow-primary/20 ${selected ? 'ring-2 ring-primary' : ''}`}>
      {/* Status Indicator */}
      <div className="absolute top-4 right-4 z-20">
        <div className={`w-3 h-3 rounded-full ${
          caseData.status === 'RESOLVED' || caseData.status === 'CLOSED' ? 'bg-gray-500' :
          caseData.status === 'AWAITING_RESPONSE' ? 'bg-yellow-500 animate-pulse' :
          'bg-green-500 animate-pulse'
        } shadow-lg`} />
      </div>

      {/* Hover Overlay with Quick Actions */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center gap-4 rounded-lg">
        <Link href={`/cases/${caseData.id}`}>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </Link>
        <Button
          size="lg"
          variant="outline"
          className="bg-background/90 hover:bg-background shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            alert('Add Note functionality coming soon!');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      <div className="flex items-start gap-4">
        {/* Selection Checkbox */}
        {onSelect && (
          <div className="pt-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(caseData.id, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={`/cases/${caseData.id}`}>
                <h3 className={`${titleSize} font-bold hover:text-primary transition-colors cursor-pointer`}>
                  {caseData.caseNumber}
                </h3>
              </Link>
              <Badge className={`${getStatusColor(caseData.status)} border rounded-full px-3 py-1 text-xs font-semibold`}>
                {caseData.status.replace('_', ' ')}
              </Badge>
              <Badge className={`${getPriorityColor(caseData.priority)} border rounded-full px-3 py-1 text-xs font-semibold`}>
                {caseData.priority}
              </Badge>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onGenerateForm?.(caseData.id)}>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Form
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAIReview?.(caseData.id)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Review
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Contact Information Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 pb-3 border-b">
            {/* Recipient Name */}
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Recipient</p>
                <p className={`${textSize} font-medium truncate`}>
                  {caseData.recipientName || caseData.customerName || 'N/A'}
                </p>
              </div>
            </div>

            {/* Customer Address */}
            {(caseData.recipientCity || caseData.recipientState || caseData.recipientZip) && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className={`${textSize} font-medium truncate`}>
                    {[caseData.recipientCity, caseData.recipientState, caseData.recipientZip].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Phone */}
            {caseData.recipientPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <a
                    href={`tel:${caseData.recipientPhone}`}
                    className={`${textSize} font-medium hover:text-primary transition-colors`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {caseData.recipientPhone}
                  </a>
                </div>
              </div>
            )}

            {/* Email */}
            {caseData.recipientEmail && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${caseData.recipientEmail}`}
                    className={`${textSize} font-medium hover:text-primary transition-colors truncate block`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {caseData.recipientEmail}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Case Details Grid */}
          <div className={`grid ${density === 'compact' ? 'grid-cols-2 md:grid-cols-4' : density === 'normal' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-5'} gap-3`}>
            {/* Tracking Number */}
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Tracking</p>
                <p className={`${textSize} font-medium truncate`}>{caseData.trackingNumber}</p>
              </div>
            </div>

            {/* Carrier */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded bg-gradient-to-br ${getCarrierGradient(caseData.carrier)} flex items-center justify-center text-lg shadow shrink-0`}>
                {getCarrierLogo(caseData.carrier)}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Carrier</p>
                <p className={`${textSize} font-medium`}>{caseData.carrier}</p>
              </div>
            </div>

            {/* Dispute Amount */}
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Claimed</p>
                <p className={`${textSize} font-bold text-green-600`}>
                  {formatCurrency(caseData.disputeAmount || 0)}
                </p>
              </div>
            </div>

            {/* Created Date */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className={`${textSize} font-medium`}>{formatDate(caseData.createdAt)}</p>
              </div>
            </div>

            {/* Destination ZIP (if detailed mode) */}
            {density === 'detailed' && caseData.recipientZip && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Destination</p>
                  <p className={`${textSize} font-medium`}>
                    {caseData.recipientCity}, {caseData.recipientState} {caseData.recipientZip}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Product Info (Detailed Mode Only) */}
          {density === 'detailed' && caseData.productName && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-1">Product</p>
              <p className={`${textSize} font-medium`}>{caseData.productName}</p>
              {caseData.productDimensions && (
                <p className="text-xs text-muted-foreground mt-1">
                  Dimensions: {caseData.productDimensions.length}" × {caseData.productDimensions.width}" × {caseData.productDimensions.height}"
                  {caseData.productDimensions.weight && ` | Weight: ${caseData.productDimensions.weight} lbs`}
                </p>
              )}
            </div>
          )}

          {/* Quick Actions (Normal & Detailed Mode) */}
          {density !== 'compact' && (
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateForm?.(caseData.id);
                }}
                className="gap-2"
              >
                <Download className="h-3 w-3" />
                Generate Form
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onAIReview?.(caseData.id);
                }}
                className="gap-2"
              >
                <Sparkles className="h-3 w-3" />
                AI Review
              </Button>
              {caseData.status === 'RESOLVED' && (
                <Badge variant="outline" className="gap-1 ml-auto">
                  <CheckCircle2 className="h-3 w-3" />
                  Resolved
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
