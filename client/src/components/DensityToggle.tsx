import { useDensity, DENSITY_INFO, DensityLevel } from '@/contexts/DensityContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Check, Maximize2 } from 'lucide-react';

export function DensityToggle() {
  const { density, setDensity } = useDensity();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          title={`Current density: ${DENSITY_INFO[density].label}`}
        >
          <Maximize2 className="h-4 w-4" />
          <span className="sr-only">Toggle density</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Information Density</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={density} onValueChange={(value) => setDensity(value as DensityLevel)}>
          {(Object.keys(DENSITY_INFO) as DensityLevel[]).map((level) => (
            <DropdownMenuRadioItem
              key={level}
              value={level}
              className="flex flex-col items-start py-3 cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{DENSITY_INFO[level].label}</span>
                  <span className="text-xs text-muted-foreground">{DENSITY_INFO[level].icon}</span>
                </div>
                {density === level && <Check className="h-4 w-4" />}
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {DENSITY_INFO[level].description}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <div className="px-2 py-2 text-xs text-muted-foreground">
          Keyboard shortcut: <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+D</kbd>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact inline toggle for toolbars
export function DensityToggleCompact() {
  const { density, toggleDensity } = useDensity();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleDensity}
      className="h-8 px-2 text-xs gap-1"
      title={`Current: ${DENSITY_INFO[density].label} (click to cycle)`}
    >
      <Maximize2 className="h-3 w-3" />
      <span className="hidden sm:inline">{DENSITY_INFO[density].label}</span>
      <span className="sm:hidden">{DENSITY_INFO[density].icon}</span>
    </Button>
  );
}
