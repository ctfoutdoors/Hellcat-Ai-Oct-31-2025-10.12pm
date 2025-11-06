import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Palette, Settings as SettingsIcon, Check, X, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Settings() {
  const { theme, setTheme, fontSize, setFontSize, effectiveTheme } = useTheme();
  
  // Track pending changes
  const [pendingTheme, setPendingTheme] = useState<typeof theme>(theme);
  const [pendingFontSize, setPendingFontSize] = useState<typeof fontSize>(fontSize);
  
  const hasChanges = pendingTheme !== theme || pendingFontSize !== fontSize;

  const themeOptions = [
    { value: "system", label: "System", description: "Match your operating system theme" },
    { value: "hellcat", label: "HellcatAI", description: "Dark slate with vibrant green accents" },
    { value: "blue", label: "Blue (ShipStation)", description: "Default theme with ShipStation green accents" },
    { value: "dark-gray", label: "Dark Gray", description: "Professional dark gray theme" },
    { value: "night", label: "Night (Black)", description: "Off-black theme for OLED displays" },
    { value: "light", label: "Light", description: "Clean light theme for daytime use" },
  ];
  
  const fontSizeOptions = [
    { value: "small", label: "Small", description: "11px base size" },
    { value: "medium", label: "Medium", description: "13px base size (default)" },
    { value: "large", label: "Large", description: "15px base size" },
    { value: "extra-large", label: "Extra Large", description: "17px base size" },
  ];

  const currentTheme = themeOptions.find(t => t.value === pendingTheme);
  const currentFontSize = fontSizeOptions.find(f => f.value === pendingFontSize);

  const handleApplyChanges = () => {
    try {
      // Apply theme
      if (pendingTheme !== theme) {
        console.log("[Settings] Applying theme:", pendingTheme);
        setTheme(pendingTheme as any);
        
        // Force immediate DOM update
        const root = window.document.documentElement;
        const effectiveValue = pendingTheme === "system" 
          ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "blue")
          : pendingTheme;
        
        root.setAttribute("data-theme", effectiveValue);
        localStorage.setItem("hellcat-theme", pendingTheme);
        
        console.log("[Settings] Theme applied. data-theme attribute:", root.getAttribute("data-theme"));
      }
      
      // Apply font size
      if (pendingFontSize !== fontSize) {
        console.log("[Settings] Applying font size:", pendingFontSize);
        setFontSize(pendingFontSize as any);
        
        // Force immediate DOM update
        const root = window.document.documentElement;
        root.setAttribute("data-font-size", pendingFontSize);
        localStorage.setItem("hellcat-font-size", pendingFontSize);
      }
      
      // Success feedback
      toast.success("Settings Applied", {
        description: `Theme: ${currentTheme?.label}, Font: ${currentFontSize?.label}`,
        icon: <Check className="text-green-500" />,
      });
    } catch (error) {
      console.error("[Settings] Error applying changes:", error);
      toast.error("Failed to Apply Settings", {
        description: "Please try again or refresh the page",
        icon: <X className="text-red-500" />,
      });
    }
  };

  const handleReset = () => {
    setPendingTheme(theme);
    setPendingFontSize(fontSize);
    toast.info("Changes Discarded", {
      description: "Settings reset to current values",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <SettingsIcon className="text-primary" size={32} />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure your Hellcat AI V4 preferences
        </p>
      </div>

      {/* Design Section */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="text-primary" size={20} />
            Design & Appearance
          </CardTitle>
          <CardDescription>
            Customize the visual appearance of your workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Selector */}
          <div className="space-y-3">
            <Label htmlFor="theme-select" className="text-base font-medium">
              Color Theme
            </Label>
            <Select value={pendingTheme} onValueChange={(value: any) => setPendingTheme(value)}>
              <SelectTrigger id="theme-select" className="w-full max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentTheme && (
              <p className="text-sm text-muted-foreground">
                {currentTheme.description}
              </p>
            )}
            {pendingTheme !== theme && (
              <p className="text-sm text-amber-500 flex items-center gap-1">
                <span>⚠️</span>
                <span>Unsaved changes - click Apply Changes to update</span>
              </p>
            )}
          </div>
          
          {/* Font Size Selector */}
          <div className="space-y-3">
            <Label htmlFor="font-size-select" className="text-base font-medium">
              Font Size
            </Label>
            <Select value={pendingFontSize} onValueChange={(value: any) => setPendingFontSize(value)}>
              <SelectTrigger id="font-size-select" className="w-full max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontSizeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentFontSize && (
              <p className="text-sm text-muted-foreground">
                {currentFontSize.description}
              </p>
            )}
            {pendingFontSize !== fontSize && (
              <p className="text-sm text-amber-500 flex items-center gap-1">
                <span>⚠️</span>
                <span>Unsaved changes - click Apply Changes to update</span>
              </p>
            )}
          </div>

          {/* Apply/Reset Buttons */}
          {hasChanges && (
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button 
                onClick={handleApplyChanges}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="mr-2" size={16} />
                Apply Changes
              </Button>
              <Button 
                onClick={handleReset}
                variant="outline"
              >
                <X className="mr-2" size={16} />
                Discard Changes
              </Button>
            </div>
          )}
          
          {/* Debug Info (can be removed later) */}
          <div className="mt-4 p-3 bg-muted/30 rounded text-xs font-mono space-y-1">
            <div>Current Theme: <span className="text-primary">{theme}</span></div>
            <div>Effective Theme: <span className="text-primary">{effectiveTheme}</span></div>
            <div>Pending Theme: <span className="text-amber-500">{pendingTheme}</span></div>
            <div>DOM data-theme: <span className="text-primary">{typeof window !== 'undefined' ? document.documentElement.getAttribute('data-theme') : 'N/A'}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* ShipStation Integration */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="text-primary" size={20} />
            ShipStation Integration
          </CardTitle>
          <CardDescription>
            Test your ShipStation API connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShipStationConnectionTest />
        </CardContent>
      </Card>

      {/* Other Settings Sections (Placeholder) */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Coming in future phases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Additional settings will be added as we build out the platform.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * ShipStation Connection Test Component
 */
function ShipStationConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      // Call the tRPC endpoint
      const response = await fetch('/api/trpc/shipstation.testConnection', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const data = await response.json();
      const testResult = data.result?.data;
      
      setResult(testResult);
      
      if (testResult?.success) {
        toast.success('ShipStation Connected!', {
          description: testResult.message,
          icon: <Check className="text-green-500" />,
        });
      } else {
        toast.error('Connection Failed', {
          description: testResult?.message || 'Unknown error',
          icon: <X className="text-red-500" />,
        });
      }
    } catch (error) {
      console.error('[ShipStation Test] Error:', error);
      toast.error('Test Failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
        icon: <X className="text-red-500" />,
      });
      setResult({ success: false, message: 'Network error' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button 
          onClick={handleTest}
          disabled={testing}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 animate-spin" size={16} />
              Testing Connection...
            </>
          ) : (
            <>
              <Package className="mr-2" size={16} />
              Test Connection
            </>
          )}
        </Button>
        
        {result && (
          <div className="flex items-center gap-2">
            {result.success ? (
              <>
                <Check className="text-green-500" size={20} />
                <span className="text-sm text-green-500 font-medium">Connected</span>
              </>
            ) : (
              <>
                <X className="text-red-500" size={20} />
                <span className="text-sm text-red-500 font-medium">Failed</span>
              </>
            )}
          </div>
        )}
      </div>
      
      {result && result.success && result.accountInfo && (
        <div className="p-4 bg-muted/30 rounded-lg space-y-2">
          <div className="text-sm font-medium">Account Information:</div>
          <div className="text-xs font-mono space-y-1">
            <div>Store Count: <span className="text-primary">{result.accountInfo.storeCount}</span></div>
            {result.accountInfo.stores && result.accountInfo.stores.length > 0 && (
              <div className="mt-2">
                <div className="font-medium mb-1">Stores:</div>
                {result.accountInfo.stores.map((store: any, idx: number) => (
                  <div key={idx} className="ml-2 text-muted-foreground">
                    • {store.storeName} (ID: {store.storeId}) - {store.active ? '✅ Active' : '❌ Inactive'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {result && !result.success && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="text-sm text-red-500 font-medium mb-1">Error Details:</div>
          <div className="text-xs text-red-400 font-mono">{result.message}</div>
        </div>
      )}
    </div>
  );
}
