import { useState, useEffect, useRef } from "react";
import { Edit, Trash2, Mail, Phone, Calendar, CheckSquare, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RadialAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick: () => void;
}

interface RadialContextMenuProps {
  actions: RadialAction[];
  x: number;
  y: number;
  onClose: () => void;
}

export function RadialContextMenu({ actions, x, y, onClose }: RadialContextMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Close on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    // Close on escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleActionClick = (action: RadialAction) => {
    action.onClick();
    handleClose();
  };

  // Calculate positions in a circle
  const radius = 120;
  const angleStep = (2 * Math.PI) / actions.length;
  const startAngle = -Math.PI / 2; // Start from top

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Center hub */}
      <div
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-16 h-16 rounded-full",
          "bg-gradient-to-br from-blue-600 to-purple-600",
          "shadow-2xl shadow-blue-500/50",
          "flex items-center justify-center",
          "transition-all duration-300 ease-out pointer-events-auto cursor-pointer",
          isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"
        )}
        onClick={handleClose}
      >
        <div className="w-12 h-12 rounded-full bg-slate-900/80 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
        </div>
      </div>

      {/* Orbital actions */}
      {actions.map((action, index) => {
        const angle = startAngle + index * angleStep;
        const actionX = Math.cos(angle) * radius;
        const actionY = Math.sin(angle) * radius;

        return (
          <div
            key={action.id}
            className={cn(
              "absolute left-1/2 top-1/2 pointer-events-auto",
              "transition-all duration-300 ease-out",
              isVisible ? "opacity-100" : "opacity-0"
            )}
            style={{
              transform: isVisible
                ? `translate(calc(-50% + ${actionX}px), calc(-50% + ${actionY}px))`
                : "translate(-50%, -50%)",
              transitionDelay: `${index * 50}ms`,
            }}
          >
            <button
              onClick={() => handleActionClick(action)}
              className={cn(
                "group relative",
                "w-14 h-14 rounded-full",
                "flex items-center justify-center",
                "transition-all duration-200",
                "hover:scale-110 active:scale-95",
                "shadow-lg hover:shadow-2xl",
                action.color
              )}
            >
              <action.icon className="h-6 w-6 text-white" />
              
              {/* Tooltip */}
              <div className={cn(
                "absolute whitespace-nowrap",
                "px-3 py-1.5 rounded-lg",
                "bg-slate-900 text-white text-xs font-medium",
                "opacity-0 group-hover:opacity-100",
                "transition-opacity duration-200",
                "pointer-events-none",
                "shadow-xl border border-slate-700",
                // Position tooltip away from center
                angle < Math.PI / 2 && angle > -Math.PI / 2 ? "left-full ml-2" : "right-full mr-2"
              )}>
                {action.label}
              </div>

              {/* Glow effect */}
              <div className={cn(
                "absolute inset-0 rounded-full",
                "opacity-0 group-hover:opacity-30",
                "transition-opacity duration-200",
                "blur-md",
                action.color
              )}></div>
            </button>

            {/* Connecting line to center */}
            <svg
              className={cn(
                "absolute left-1/2 top-1/2 pointer-events-none",
                "transition-opacity duration-300",
                isVisible ? "opacity-20" : "opacity-0"
              )}
              style={{
                width: Math.abs(actionX) * 2,
                height: Math.abs(actionY) * 2,
                transform: `translate(-50%, -50%)`,
              }}
            >
              <line
                x1="50%"
                y1="50%"
                x2={actionX > 0 ? "0%" : "100%"}
                y2={actionY > 0 ? "0%" : "100%"}
                stroke="url(#gradient)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        );
      })}

      {/* Backdrop blur */}
      <div
        className={cn(
          "fixed inset-0 -z-10",
          "transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: "radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
        }}
      ></div>
    </div>
  );
}

// Default action configurations
export const DEFAULT_CUSTOMER_ACTIONS: Omit<RadialAction, "onClick">[] = [
  {
    id: "edit",
    label: "Edit Customer",
    icon: Edit,
    color: "bg-blue-600 hover:bg-blue-700",
  },
  {
    id: "email",
    label: "Send Email",
    icon: Mail,
    color: "bg-green-600 hover:bg-green-700",
  },
  {
    id: "call",
    label: "Make Call",
    icon: Phone,
    color: "bg-emerald-600 hover:bg-emerald-700",
  },
  {
    id: "meeting",
    label: "Schedule Meeting",
    icon: Calendar,
    color: "bg-purple-600 hover:bg-purple-700",
  },
  {
    id: "task",
    label: "Create Task",
    icon: CheckSquare,
    color: "bg-orange-600 hover:bg-orange-700",
  },
  {
    id: "delete",
    label: "Delete Customer",
    icon: Trash2,
    color: "bg-red-600 hover:bg-red-700",
  },
];
