import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Edit,
  Eye,
  Copy,
  FileDown,
  FileStack,
  Flag,
  Archive,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface RadialMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
  color?: string;
  disabled?: boolean;
}

interface RadialContextMenuProps {
  x: number;
  y: number;
  items: RadialMenuItem[];
  onClose: () => void;
  centerLabel?: string;
}

export function RadialContextMenu({
  x,
  y,
  items,
  onClose,
  centerLabel = "Close",
}: RadialContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Limit to 8 items
  const displayItems = items.slice(0, 8);
  const radius = 120; // Distance from center to bubbles
  const centerSize = 60; // Center button size
  const bubbleSize = 56; // Bubble size

  useEffect(() => {
    setIsAnimating(true);

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Small delay to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Calculate position for each bubble
  const getBubblePosition = (index: number, total: number) => {
    const angle = (360 / total) * index - 90; // Start from top
    const radian = (angle * Math.PI) / 180;
    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    };
  };

  // Adjust menu position to keep it on screen
  const getAdjustedPosition = () => {
    const menuSize = radius * 2 + bubbleSize;
    const padding = 20;

    let adjustedX = x - radius - centerSize / 2;
    let adjustedY = y - radius - centerSize / 2;

    // Keep within viewport
    if (adjustedX < padding) adjustedX = padding;
    if (adjustedY < padding) adjustedY = padding;
    if (adjustedX + menuSize > window.innerWidth - padding) {
      adjustedX = window.innerWidth - menuSize - padding;
    }
    if (adjustedY + menuSize > window.innerHeight - padding) {
      adjustedY = window.innerHeight - menuSize - padding;
    }

    return { x: adjustedX, y: adjustedY };
  };

  const position = getAdjustedPosition();

  const handleItemClick = (item: RadialMenuItem) => {
    if (!item.disabled) {
      item.action();
      onClose();
    }
  };

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        width: (radius + bubbleSize) * 2,
        height: (radius + bubbleSize) * 2,
      }}
    >
      {/* Center Core Button */}
      <div
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "pointer-events-auto cursor-pointer",
          "transition-all duration-300",
          isAnimating ? "scale-100 opacity-100" : "scale-0 opacity-0"
        )}
        style={{
          width: centerSize,
          height: centerSize,
        }}
      >
        <button
          onClick={onClose}
          className={cn(
            "w-full h-full rounded-full",
            "bg-gradient-to-br from-gray-800 to-gray-900",
            "border-2 border-gray-600",
            "shadow-[0_0_20px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.1)]",
            "hover:shadow-[0_0_30px_rgba(59,130,246,0.5),inset_0_2px_4px_rgba(255,255,255,0.2)]",
            "hover:border-blue-500",
            "transition-all duration-200",
            "flex items-center justify-center",
            "group"
          )}
          aria-label={centerLabel}
        >
          <X className="h-6 w-6 text-gray-400 group-hover:text-blue-400 transition-colors" />
        </button>

        {/* Center glow effect */}
        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl -z-10" />
      </div>

      {/* Radial Bubbles */}
      {displayItems.map((item, index) => {
        const pos = getBubblePosition(index, displayItems.length);
        const Icon = item.icon;
        const isHovered = hoveredIndex === index;

        return (
          <div
            key={item.id}
            className={cn(
              "absolute left-1/2 top-1/2 pointer-events-auto",
              "transition-all duration-300",
              isAnimating ? "scale-100 opacity-100" : "scale-0 opacity-0"
            )}
            style={{
              width: bubbleSize,
              height: bubbleSize,
              transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
              transitionDelay: `${index * 30}ms`,
            }}
          >
            <button
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              disabled={item.disabled}
              className={cn(
                "w-full h-full rounded-full",
                "bg-gradient-to-br from-gray-700 to-gray-800",
                "border-2 border-gray-600",
                "shadow-[0_0_15px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.1)]",
                "hover:shadow-[0_0_25px_rgba(59,130,246,0.6),inset_0_2px_4px_rgba(255,255,255,0.2)]",
                "hover:border-blue-500",
                "hover:scale-110",
                "active:scale-95",
                "transition-all duration-200",
                "flex items-center justify-center",
                "group relative",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-label={item.label}
            >
              <Icon
                className={cn(
                  "h-6 w-6 transition-colors",
                  item.color || "text-gray-300 group-hover:text-blue-400",
                  item.disabled && "text-gray-500"
                )}
              />

              {/* Bubble glow effect */}
              {isHovered && !item.disabled && (
                <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-lg -z-10 animate-pulse" />
              )}

              {/* Tooltip */}
              {isHovered && (
                <div
                  className={cn(
                    "absolute z-10 px-3 py-1.5 rounded-md",
                    "bg-gray-900 border border-gray-700",
                    "text-xs text-white whitespace-nowrap",
                    "shadow-lg",
                    "pointer-events-none",
                    // Position tooltip away from center
                    pos.y < 0 ? "top-full mt-2" : "bottom-full mb-2"
                  )}
                >
                  {item.label}
                  <div
                    className={cn(
                      "absolute left-1/2 -translate-x-1/2",
                      "w-0 h-0 border-4 border-transparent",
                      pos.y < 0
                        ? "top-0 -translate-y-full border-b-gray-700"
                        : "bottom-0 translate-y-full border-t-gray-700"
                    )}
                  />
                </div>
              )}
            </button>

            {/* Connection line to center (subtle) */}
            <div
              className="absolute left-1/2 top-1/2 w-0.5 bg-gradient-to-r from-gray-700/50 to-transparent -z-10"
              style={{
                height: radius - centerSize / 2 - bubbleSize / 2,
                transformOrigin: "top center",
                transform: `translate(-50%, -100%) rotate(${
                  (360 / displayItems.length) * index - 90
                }deg)`,
              }}
            />
          </div>
        );
      })}

      {/* Background overlay with radial gradient */}
      <div className="absolute inset-0 -z-20 rounded-full bg-gradient-radial from-gray-900/80 via-gray-900/40 to-transparent blur-sm" />
    </div>,
    document.body
  );
}

// Hook to use radial menu
export function useRadialMenu() {
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    items: RadialMenuItem[];
  } | null>(null);

  const showMenu = (x: number, y: number, items: RadialMenuItem[]) => {
    setMenu({ x, y, items });
  };

  const closeMenu = () => {
    setMenu(null);
  };

  const MenuComponent = menu ? (
    <RadialContextMenu
      x={menu.x}
      y={menu.y}
      items={menu.items}
      onClose={closeMenu}
    />
  ) : null;

  return { showMenu, closeMenu, MenuComponent };
}

// Default action sets for different contexts
export const defaultActions = {
  caseCard: (caseId: number, caseNumber: string): RadialMenuItem[] => [
    {
      id: "edit",
      label: "Quick Edit",
      icon: Edit,
      action: () => console.log("Edit case", caseId),
      color: "text-blue-400",
    },
    {
      id: "view",
      label: "View Details",
      icon: Eye,
      action: () => (window.location.href = `/cases/${caseId}`),
      color: "text-green-400",
    },
    {
      id: "duplicate",
      label: "Duplicate",
      icon: Copy,
      action: () => console.log("Duplicate case", caseId),
      color: "text-purple-400",
    },
    {
      id: "export",
      label: "Export PDF",
      icon: FileDown,
      action: () => console.log("Export case", caseId),
      color: "text-orange-400",
    },
    {
      id: "template",
      label: "Save as Template",
      icon: FileStack,
      action: () => console.log("Save template", caseId),
      color: "text-cyan-400",
    },
    {
      id: "priority",
      label: "Mark Priority",
      icon: Flag,
      action: () => console.log("Mark priority", caseId),
      color: "text-yellow-400",
    },
    {
      id: "archive",
      label: "Archive",
      icon: Archive,
      action: () => console.log("Archive case", caseId),
      color: "text-gray-400",
    },
    {
      id: "delete",
      label: "Delete",
      icon: Trash2,
      action: () => console.log("Delete case", caseId),
      color: "text-red-400",
    },
  ],
};
