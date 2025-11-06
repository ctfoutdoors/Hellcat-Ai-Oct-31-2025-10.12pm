import React from 'react';

interface CarrierLogoProps {
  carrier: 'FEDEX' | 'UPS' | 'USPS' | 'DHL' | 'OTHER';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const CarrierLogo: React.FC<CarrierLogoProps> = ({ carrier, size = 'md', showText = true }) => {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const carrierConfig = {
    FEDEX: {
      name: 'FedEx',
      color: '#4D148C',
      bgColor: '#F5F0FF',
      textColor: '#4D148C',
    },
    UPS: {
      name: 'UPS',
      color: '#351C15',
      bgColor: '#FFF8E7',
      textColor: '#351C15',
    },
    USPS: {
      name: 'USPS',
      color: '#004B87',
      bgColor: '#E8F4FF',
      textColor: '#004B87',
    },
    DHL: {
      name: 'DHL',
      color: '#FFCC00',
      bgColor: '#FFF9E6',
      textColor: '#D40511',
    },
    OTHER: {
      name: 'Other',
      color: '#6B7280',
      bgColor: '#F3F4F6',
      textColor: '#374151',
    },
  };

  const config = carrierConfig[carrier];

  const renderLogo = () => {
    switch (carrier) {
      case 'FEDEX':
        return (
          <div className="flex items-center gap-2">
            <div 
              className={`${sizeClasses[size]} px-3 py-1 rounded font-bold flex items-center`}
              style={{ backgroundColor: config.bgColor, color: config.textColor }}
            >
              <span className="font-bold tracking-tight">Fed</span>
              <span className="font-bold tracking-tight" style={{ color: '#FF6600' }}>Ex</span>
            </div>
            {showText && <span className={`${textSizeClasses[size]} font-medium text-gray-700`}>{config.name}</span>}
          </div>
        );
      
      case 'UPS':
        return (
          <div className="flex items-center gap-2">
            <div 
              className={`${sizeClasses[size]} px-3 py-1 rounded font-bold`}
              style={{ backgroundColor: config.color, color: '#FFB500' }}
            >
              UPS
            </div>
            {showText && <span className={`${textSizeClasses[size]} font-medium text-gray-700`}>{config.name}</span>}
          </div>
        );
      
      case 'USPS':
        return (
          <div className="flex items-center gap-2">
            <div 
              className={`${sizeClasses[size]} px-3 py-1 rounded font-bold`}
              style={{ backgroundColor: config.color, color: 'white' }}
            >
              USPS
            </div>
            {showText && <span className={`${textSizeClasses[size]} font-medium text-gray-700`}>{config.name}</span>}
          </div>
        );
      
      case 'DHL':
        return (
          <div className="flex items-center gap-2">
            <div 
              className={`${sizeClasses[size]} px-3 py-1 rounded font-bold`}
              style={{ backgroundColor: config.color, color: config.textColor }}
            >
              DHL
            </div>
            {showText && <span className={`${textSizeClasses[size]} font-medium text-gray-700`}>{config.name}</span>}
          </div>
        );
      
      default:
        return (
          <div className="flex items-center gap-2">
            <div 
              className={`${sizeClasses[size]} px-3 py-1 rounded font-medium`}
              style={{ backgroundColor: config.bgColor, color: config.textColor }}
            >
              {carrier}
            </div>
            {showText && <span className={`${textSizeClasses[size]} font-medium text-gray-700`}>{config.name}</span>}
          </div>
        );
    }
  };

  return renderLogo();
};

export default CarrierLogo;
