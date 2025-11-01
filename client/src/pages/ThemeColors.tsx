import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useThemeCustomizer } from '@/contexts/ThemeCustomizerContext';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function ThemeColors() {
  const { colors, setColors, resetColors } = useThemeCustomizer();

  const handleColorChange = (key: keyof typeof colors, value: string) => {
    setColors({ [key]: value });
    toast.success('Color updated');
  };

  const handleReset = () => {
    resetColors();
    toast.success('Colors reset to default');
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Theme Colors</h1>
        <p className="text-muted-foreground mt-1">
          Customize the color scheme of your carrier dispute system
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Primary Color */}
          <div>
            <Label htmlFor="primary" className="text-base font-semibold mb-3 block">
              Primary Color
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Main brand color used for buttons, links, and active states
            </p>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="color"
                  id="primary"
                  value={colors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="h-12 w-24 rounded border border-gray-300 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={colors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                  placeholder="#2C5F2D"
                />
              </div>
              <div
                className="h-12 w-24 rounded border border-gray-300"
                style={{ backgroundColor: colors.primary }}
              />
            </div>
          </div>

          {/* Primary Dark */}
          <div>
            <Label htmlFor="primaryDark" className="text-base font-semibold mb-3 block">
              Primary Dark
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Darker shade used for header background and emphasis
            </p>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="color"
                  id="primaryDark"
                  value={colors.primaryDark}
                  onChange={(e) => handleColorChange('primaryDark', e.target.value)}
                  className="h-12 w-24 rounded border border-gray-300 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={colors.primaryDark}
                  onChange={(e) => handleColorChange('primaryDark', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                  placeholder="#1E4620"
                />
              </div>
              <div
                className="h-12 w-24 rounded border border-gray-300"
                style={{ backgroundColor: colors.primaryDark }}
              />
            </div>
          </div>

          {/* Primary Light */}
          <div>
            <Label htmlFor="primaryLight" className="text-base font-semibold mb-3 block">
              Primary Light
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Lighter shade used for hover states and backgrounds
            </p>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="color"
                  id="primaryLight"
                  value={colors.primaryLight}
                  onChange={(e) => handleColorChange('primaryLight', e.target.value)}
                  className="h-12 w-24 rounded border border-gray-300 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={colors.primaryLight}
                  onChange={(e) => handleColorChange('primaryLight', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                  placeholder="#3A7A3E"
                />
              </div>
              <div
                className="h-12 w-24 rounded border border-gray-300"
                style={{ backgroundColor: colors.primaryLight }}
              />
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <Label htmlFor="accent" className="text-base font-semibold mb-3 block">
              Accent Color
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Bright accent color for highlights and call-to-action elements
            </p>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="color"
                  id="accent"
                  value={colors.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="h-12 w-24 rounded border border-gray-300 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={colors.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                  placeholder="#5CAF63"
                />
              </div>
              <div
                className="h-12 w-24 rounded border border-gray-300"
                style={{ backgroundColor: colors.accent }}
              />
            </div>
          </div>

          {/* Preview Section */}
          <div className="pt-6 border-t">
            <h3 className="text-base font-semibold mb-4">Preview</h3>
            <div className="space-y-3">
              <Button
                style={{ backgroundColor: colors.primary }}
                className="text-white"
              >
                Primary Button
              </Button>
              <div className="flex gap-2">
                <div
                  className="h-16 flex-1 rounded flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: colors.primaryDark }}
                >
                  Header Dark
                </div>
                <div
                  className="h-16 flex-1 rounded flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: colors.primary }}
                >
                  Primary
                </div>
                <div
                  className="h-16 flex-1 rounded flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: colors.primaryLight }}
                >
                  Hover Light
                </div>
                <div
                  className="h-16 flex-1 rounded flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: colors.accent }}
                >
                  Accent
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </Button>
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> Colors are saved automatically and will persist across sessions.
              Changes apply immediately to the entire application.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
