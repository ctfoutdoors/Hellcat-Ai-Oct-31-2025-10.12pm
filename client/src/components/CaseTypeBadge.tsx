import React from 'react';
import { Badge } from '@/components/ui/badge';
import { PackageX, DollarSign, Clock } from 'lucide-react';

type CaseType = 'DAMAGE' | 'ADJUSTMENT' | 'SLA';

interface CaseTypeBadgeProps {
  caseType: CaseType;
  className?: string;
}

const CaseTypeBadge: React.FC<CaseTypeBadgeProps> = ({ caseType, className = '' }) => {
  const getTypeConfig = (type: CaseType) => {
    switch (type) {
      case 'DAMAGE':
        return {
          label: 'Damage Claim',
          icon: PackageX,
          className: 'bg-red-100 text-red-800 hover:bg-red-100',
        };
      case 'ADJUSTMENT':
        return {
          label: 'Adjustment',
          icon: DollarSign,
          className: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
        };
      case 'SLA':
        return {
          label: 'SLA Violation',
          icon: Clock,
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
        };
      default:
        return {
          label: type,
          icon: PackageX,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
        };
    }
  };

  const config = getTypeConfig(caseType);
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} ${className} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export default CaseTypeBadge;
