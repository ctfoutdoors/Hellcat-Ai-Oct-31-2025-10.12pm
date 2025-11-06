import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  value: string;
  label?: string;
  size?: 'sm' | 'md';
}

const CopyButton: React.FC<CopyButtonProps> = ({ value, label, size = 'sm' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      
      // Success feedback handled by icon change

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center p-1 rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
      title={`Copy ${label || 'value'}`}
      type="button"
    >
      {copied ? (
        <Check className={`${iconSize} text-green-600`} />
      ) : (
        <Copy className={iconSize} />
      )}
    </button>
  );
};

export default CopyButton;
