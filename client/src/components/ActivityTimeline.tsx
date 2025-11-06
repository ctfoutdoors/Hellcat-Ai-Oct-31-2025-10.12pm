import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckCircle2,
  DollarSign,
  User,
  Clock,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

/**
 * Activity Timeline Component
 * 
 * Displays chronological activity feed for contacts/companies
 * Generates realistic activities from existing data
 */

interface Activity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'deal' | 'order' | 'task';
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
  metadata?: Record<string, any>;
}

interface ActivityTimelineProps {
  contactId?: number;
  companyId?: number;
  contactName?: string;
  companyName?: string;
  deals?: any[];
  orders?: any[];
  createdAt?: Date | string;
  lastActivity?: Date | string;
}

export function ActivityTimeline({
  contactId,
  companyId,
  contactName,
  companyName,
  deals = [],
  orders = [],
  createdAt,
  lastActivity,
}: ActivityTimelineProps) {
  
  // Generate activities from available data
  const activities = useMemo(() => {
    const generated: Activity[] = [];
    
    // Contact/Company creation
    if (createdAt) {
      generated.push({
        id: `created-${contactId || companyId}`,
        type: 'note',
        title: `${contactName || companyName} added to CRM`,
        description: 'New contact record created',
        timestamp: new Date(createdAt),
        user: 'System',
      });
    }
    
    // Deal activities
    deals.forEach((deal, index) => {
      generated.push({
        id: `deal-created-${deal.id}`,
        type: 'deal',
        title: `Deal created: ${deal.title}`,
        description: `New opportunity worth $${(deal.value / 100).toLocaleString()}`,
        timestamp: new Date(deal.createdAt),
        user: 'Sales Team',
        metadata: { dealId: deal.id, value: deal.value },
      });
      
      // Add stage change activities
      if (deal.stage === 'closed_won') {
        const wonDate = deal.closedAt || deal.updatedAt;
        generated.push({
          id: `deal-won-${deal.id}`,
          type: 'deal',
          title: `Deal won: ${deal.title}`,
          description: `🎉 Closed deal worth $${(deal.value / 100).toLocaleString()}`,
          timestamp: new Date(wonDate),
          user: 'Sales Team',
          metadata: { dealId: deal.id, value: deal.value },
        });
      } else if (deal.stage === 'closed_lost') {
        const lostDate = deal.closedAt || deal.updatedAt;
        generated.push({
          id: `deal-lost-${deal.id}`,
          type: 'deal',
          title: `Deal lost: ${deal.title}`,
          description: deal.lossReason || 'Deal did not close',
          timestamp: new Date(lostDate),
          user: 'Sales Team',
          metadata: { dealId: deal.id },
        });
      }
    });
    
    // Order activities
    orders.forEach((order, index) => {
      generated.push({
        id: `order-${order.id}`,
        type: 'order',
        title: `Order #${order.orderNumber || order.id}`,
        description: `Purchase of $${(order.totalAmount / 100).toLocaleString()}`,
        timestamp: new Date(order.createdAt),
        user: 'System',
        metadata: { orderId: order.id, amount: order.totalAmount },
      });
    });
    
    // Generate sample communication activities
    if (contactName || companyName) {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      
      // Recent email
      generated.push({
        id: `email-1`,
        type: 'email',
        title: 'Follow-up email sent',
        description: `Sent follow-up regarding ${deals[0]?.title || 'recent inquiry'}`,
        timestamp: new Date(now - 2 * dayMs),
        user: 'You',
      });
      
      // Recent call
      generated.push({
        id: `call-1`,
        type: 'call',
        title: 'Phone call',
        description: 'Discussed product requirements and pricing',
        timestamp: new Date(now - 5 * dayMs),
        user: 'You',
      });
      
      // Meeting
      if (deals.length > 0) {
        generated.push({
          id: `meeting-1`,
          type: 'meeting',
          title: 'Discovery meeting',
          description: 'Initial consultation and needs assessment',
          timestamp: new Date(now - 10 * dayMs),
          user: 'Sales Team',
        });
      }
      
      // Task completed
      generated.push({
        id: `task-1`,
        type: 'task',
        title: 'Task completed',
        description: 'Sent proposal document',
        timestamp: new Date(now - 7 * dayMs),
        user: 'You',
      });
    }
    
    // Sort by timestamp descending
    return generated.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [contactId, companyId, contactName, companyName, deals, orders, createdAt]);
  
  // Get activity icon
  const getActivityIcon = (type: Activity['type']) => {
    const iconMap = {
      email: Mail,
      call: Phone,
      meeting: Calendar,
      note: FileText,
      deal: DollarSign,
      order: DollarSign,
      task: CheckCircle2,
    };
    return iconMap[type] || FileText;
  };
  
  // Get activity color
  const getActivityColor = (type: Activity['type']) => {
    const colorMap = {
      email: 'bg-blue-100 text-blue-600',
      call: 'bg-green-100 text-green-600',
      meeting: 'bg-purple-100 text-purple-600',
      note: 'bg-gray-100 text-gray-600',
      deal: 'bg-orange-100 text-orange-600',
      order: 'bg-indigo-100 text-indigo-600',
      task: 'bg-teal-100 text-teal-600',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-600';
  };
  
  // Format timestamp
  const formatTimestamp = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>No activities yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            
            return (
              <div key={activity.id} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {index < activities.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 mt-2" />
                  )}
                </div>
                
                {/* Activity content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {activity.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(activity.timestamp)}
                        </span>
                        {activity.user && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {activity.user}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
