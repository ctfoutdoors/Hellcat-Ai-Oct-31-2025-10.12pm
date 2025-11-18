import { useState, useEffect } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, Building2, DollarSign, Calendar, TrendingUp, User } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface LeadHoverCardProps {
  leadId: number;
  children: React.ReactNode;
}

export function LeadHoverCard({ leadId, children }: LeadHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  
  // Delay fetch by 1 second after hover
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      timer = setTimeout(() => {
        setShouldFetch(true);
      }, 1000);
    } else {
      setShouldFetch(false);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  const { data, isLoading } = trpc.crm.leads.get.useQuery(
    { id: leadId },
    { enabled: shouldFetch }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'contacted': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50';
      case 'qualified': return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      case 'proposal': return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'negotiation': return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'won': return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'lost': return 'bg-red-500/20 text-red-300 border-red-500/50';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/50';
    }
  };

  return (
    <HoverCard openDelay={0} closeDelay={200} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        side="top" 
        align="start"
        sideOffset={5}
        alignOffset={-50}
        collisionPadding={{ top: 20, right: 20, bottom: 20, left: 20 }}
        className="w-96 p-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 shadow-2xl z-[100] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=top]:slide-in-from-bottom-2 duration-200"
      >
        {isLoading || !data ? (
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-b border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {data.lead.title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {data.lead.companyName || 'No company'}
                  </p>
                </div>
                <Badge variant="outline" className={getStatusColor(data.lead.status)}>
                  {data.lead.status}
                </Badge>
              </div>
            </div>

            {/* Contact Info */}
            <div className="p-6 space-y-3">
              <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Contact</h4>
              {data.lead.contactName && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-200">{data.lead.contactName}</span>
                </div>
              )}
              {data.lead.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-slate-200">{data.lead.email}</span>
                </div>
              )}
              {data.lead.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-green-400" />
                  <span className="text-slate-200">{data.lead.phone}</span>
                </div>
              )}
              {data.lead.companyName && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-purple-400" />
                  <span className="text-slate-200">{data.lead.companyName}</span>
                </div>
              )}
            </div>

            <Separator className="bg-slate-700" />

            {/* Stats Grid */}
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-slate-400 uppercase">Est. Value</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ${data.lead.estimatedValue ? parseFloat(data.lead.estimatedValue).toLocaleString() : '0'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Deal size</p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-slate-400 uppercase">Probability</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {data.lead.probability || 0}%
                </p>
                <p className="text-xs text-slate-500 mt-1">Win chance</p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-slate-400 uppercase">Created</span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {new Date(data.lead.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {Math.floor((Date.now() - new Date(data.lead.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                </p>
              </div>

              {data.lead.expectedCloseDate && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-amber-400" />
                    <span className="text-xs text-slate-400 uppercase">Close Date</span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {new Date(data.lead.expectedCloseDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {Math.ceil((new Date(data.lead.expectedCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {data.lead.description && (
              <>
                <Separator className="bg-slate-700" />
                <div className="p-6">
                  <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
                    Notes
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {data.lead.description}
                  </p>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="p-4 bg-slate-800/30 border-t border-slate-700">
              <p className="text-xs text-slate-500 text-center">
                Right-click or double-click for quick actions
              </p>
            </div>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
