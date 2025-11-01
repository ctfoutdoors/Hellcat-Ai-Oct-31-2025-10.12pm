import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, PauseCircle } from 'lucide-react';

type RecipientStatus = 'ACTIVE' | 'INACTIVE' | 'ON_HOLD';

interface RecipientStatusBadgeProps {
  status: RecipientStatus;
  className?: string;
}

const RecipientStatusBadge: React.FC<RecipientStatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = (status: RecipientStatus) => {
    switch (status) {
      case 'ACTIVE':
        return {
          label: 'Active',
          variant: 'default' as const,
          icon: CheckCircle2,
          className: 'bg-green-100 text-green-800 hover:bg-green-100',
        };
      case 'INACTIVE':
        return {
          label: 'Inactive',
          variant: 'secondary' as const,
          icon: XCircle,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
        };
      case 'ON_HOLD':
        return {
          label: 'On Hold',
          variant: 'outline' as const,
          icon: PauseCircle,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
        };
      default:
        return {
          label: status,
          variant: 'outline' as const,
          icon: CheckCircle2,
          className: '',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} ${className} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export default RecipientStatusBadge;
