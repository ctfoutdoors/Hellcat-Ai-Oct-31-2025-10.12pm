import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Bell,
  Volume2,
  Palette,
  Sparkles,
  Settings2,
  RotateCcw,
  Download,
  Upload,
  Play,
  Moon,
} from "lucide-react";

export default function NotificationSettings() {
  const { data: preferences, isLoading, refetch } = trpc.notifications.getPreferences.useQuery();
  const updatePreferences = trpc.notifications.updatePreferences.useMutation();
  const resetPreferences = trpc.notifications.resetPreferences.useMutation();
  const createTest = trpc.notifications.createTest.useMutation();

  const [localPrefs, setLocalPrefs] = useState<any>(null);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  const handleUpdate = async (updates: any) => {
    const newPrefs = { ...localPrefs, ...updates };
    setLocalPrefs(newPrefs);

    try {
      await updatePreferences.mutateAsync(updates);
      toast.success("Preferences updated");
    } catch (error) {
      toast.error("Failed to update preferences");
    }
  };

  const handleReset = async () => {
    try {
      await resetPreferences.mutateAsync();
      await refetch();
      toast.success("Preferences reset to defaults");
    } catch (error) {
      toast.error("Failed to reset preferences");
    }
  };

  const handleTestNotification = async (type: "INFO" | "SUCCESS" | "WARNING" | "ERROR") => {
    const messages = {
      INFO: { title: "Information", message: "This is an info notification" },
      SUCCESS: { title: "Success!", message: "Operation completed successfully" },
      WARNING: { title: "Warning", message: "Please review this carefully" },
      ERROR: { title: "Error", message: "Something went wrong" },
    };

    try {
      await createTest.mutateAsync({ type, ...messages[type] });
      toast.success("Test notification sent");
    } catch (error) {
      toast.error("Failed to send test notification");
    }
  };

  const applyPreset = (preset: "default" | "minimal" | "bold" | "subtle") => {
    const presets = {
      default: {
        position: "TOP_RIGHT",
        size: "NORMAL",
        animationType: "SLIDE",
        borderRadius: 8,
        shadowIntensity: 3,
        opacity: 100,
      },
      minimal: {
        position: "TOP_CENTER",
        size: "COMPACT",
        animationType: "FADE",
        borderRadius: 4,
        shadowIntensity: 1,
        opacity: 95,
      },
      bold: {
        position: "BOTTOM_RIGHT",
        size: "LARGE",
        animationType: "BOUNCE",
        borderRadius: 12,
        shadowIntensity: 5,
        opacity: 100,
      },
      subtle: {
        position: "TOP_RIGHT",
        size: "COMPACT",
        animationType: "FADE",
        borderRadius: 16,
        shadowIntensity: 2,
        opacity: 90,
      },
    };

    handleUpdate(presets[preset]);
  };

  if (isLoading || !localPrefs) {
    return <div className="p-6">Loading preferences...</div>;
  }

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground mt-1">
            Customize how you receive and view notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="appearance">
                <Palette className="h-4 w-4 mr-2" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="effects">
                <Sparkles className="h-4 w-4 mr-2" />
                Effects
              </TabsTrigger>
              <TabsTrigger value="content">
                <Settings2 className="h-4 w-4 mr-2" />
                Content
              </TabsTrigger>
              <TabsTrigger value="behavior">
                <Bell className="h-4 w-4 mr-2" />
                Behavior
              </TabsTrigger>
              <TabsTrigger value="quiet">
                <Moon className="h-4 w-4 mr-2" />
                Quiet
              </TabsTrigger>
            </TabsList>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Position</CardTitle>
                  <CardDescription>Where notifications appear on screen</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={localPrefs.position}
                    onValueChange={(value) => handleUpdate({ position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOP_LEFT">Top Left</SelectItem>
                      <SelectItem value="TOP_CENTER">Top Center</SelectItem>
                      <SelectItem value="TOP_RIGHT">Top Right</SelectItem>
                      <SelectItem value="BOTTOM_LEFT">Bottom Left</SelectItem>
                      <SelectItem value="BOTTOM_CENTER">Bottom Center</SelectItem>
                      <SelectItem value="BOTTOM_RIGHT">Bottom Right</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Size</CardTitle>
                  <CardDescription>Notification size</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={localPrefs.size}
                    onValueChange={(value) => handleUpdate({ size: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPACT">Compact</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="LARGE">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Border Radius</CardTitle>
                  <CardDescription>{localPrefs.borderRadius}px</CardDescription>
                </CardHeader>
                <CardContent>
                  <Slider
                    value={[localPrefs.borderRadius]}
                    onValueChange={([value]) => handleUpdate({ borderRadius: value })}
                    min={0}
                    max={20}
                    step={1}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shadow Intensity</CardTitle>
                  <CardDescription>Level {localPrefs.shadowIntensity} of 5</CardDescription>
                </CardHeader>
                <CardContent>
                  <Slider
                    value={[localPrefs.shadowIntensity]}
                    onValueChange={([value]) => handleUpdate({ shadowIntensity: value })}
                    min={0}
                    max={5}
                    step={1}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Opacity</CardTitle>
                  <CardDescription>{localPrefs.opacity}%</CardDescription>
                </CardHeader>
                <CardContent>
                  <Slider
                    value={[localPrefs.opacity]}
                    onValueChange={([value]) => handleUpdate({ opacity: value })}
                    min={50}
                    max={100}
                    step={5}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Font Size</CardTitle>
                  <CardDescription>{localPrefs.fontSize}px</CardDescription>
                </CardHeader>
                <CardContent>
                  <Slider
                    value={[localPrefs.fontSize]}
                    onValueChange={([value]) => handleUpdate({ fontSize: value })}
                    min={12}
                    max={18}
                    step={1}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Effects Tab */}
            <TabsContent value="effects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Animation Type</CardTitle>
                  <CardDescription>How notifications enter the screen</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={localPrefs.animationType}
                    onValueChange={(value) => handleUpdate({ animationType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SLIDE">Slide</SelectItem>
                      <SelectItem value="FADE">Fade</SelectItem>
                      <SelectItem value="BOUNCE">Bounce</SelectItem>
                      <SelectItem value="SCALE">Scale</SelectItem>
                      <SelectItem value="FLIP">Flip</SelectItem>
                      <SelectItem value="NONE">None</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Animation Duration</CardTitle>
                  <CardDescription>{localPrefs.animationDuration}ms</CardDescription>
                </CardHeader>
                <CardContent>
                  <Slider
                    value={[localPrefs.animationDuration]}
                    onValueChange={([value]) => handleUpdate({ animationDuration: value })}
                    min={100}
                    max={1000}
                    step={50}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sound</CardTitle>
                  <CardDescription>Notification sound settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Sound</Label>
                    <Switch
                      checked={localPrefs.soundEnabled}
                      onCheckedChange={(checked) => handleUpdate({ soundEnabled: checked })}
                    />
                  </div>

                  {localPrefs.soundEnabled && (
                    <>
                      <div>
                        <Label>Sound Type</Label>
                        <Select
                          value={localPrefs.soundType}
                          onValueChange={(value) => handleUpdate({ soundType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="chime">Chime</SelectItem>
                            <SelectItem value="ding">Ding</SelectItem>
                            <SelectItem value="pop">Pop</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Volume: {localPrefs.soundVolume}%</Label>
                        <Slider
                          value={[localPrefs.soundVolume]}
                          onValueChange={([value]) => handleUpdate({ soundVolume: value })}
                          min={0}
                          max={100}
                          step={10}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vibration (Mobile)</CardTitle>
                  <CardDescription>Vibration pattern settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Vibration</Label>
                    <Switch
                      checked={localPrefs.vibrationEnabled}
                      onCheckedChange={(checked) => handleUpdate({ vibrationEnabled: checked })}
                    />
                  </div>

                  {localPrefs.vibrationEnabled && (
                    <div>
                      <Label>Pattern</Label>
                      <Select
                        value={localPrefs.vibrationPattern}
                        onValueChange={(value) => handleUpdate({ vibrationPattern: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short</SelectItem>
                          <SelectItem value="long">Long</SelectItem>
                          <SelectItem value="double">Double</SelectItem>
                          <SelectItem value="triple">Triple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Visibility</CardTitle>
                  <CardDescription>What to show in notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Show Icons</Label>
                    <Switch
                      checked={localPrefs.showIcons}
                      onCheckedChange={(checked) => handleUpdate({ showIcons: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Show Timestamps</Label>
                    <Switch
                      checked={localPrefs.showTimestamps}
                      onCheckedChange={(checked) => handleUpdate({ showTimestamps: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Show Action Buttons</Label>
                    <Switch
                      checked={localPrefs.showActionButtons}
                      onCheckedChange={(checked) => handleUpdate({ showActionButtons: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Show Close Button</Label>
                    <Switch
                      checked={localPrefs.showCloseButton}
                      onCheckedChange={(checked) => handleUpdate({ showCloseButton: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Timestamp Format</CardTitle>
                  <CardDescription>How timestamps are displayed</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={localPrefs.timestampFormat}
                    onValueChange={(value) => handleUpdate({ timestampFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relative">Relative (2 mins ago)</SelectItem>
                      <SelectItem value="absolute">Absolute (2:30 PM)</SelectItem>
                      <SelectItem value="time-only">Time Only (14:30)</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Icon Style</CardTitle>
                  <CardDescription>Icon appearance</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={localPrefs.iconStyle}
                    onValueChange={(value) => handleUpdate({ iconStyle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="filled">Filled</SelectItem>
                      <SelectItem value="outlined">Outlined</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Behavior Tab */}
            <TabsContent value="behavior" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Auto Dismiss</CardTitle>
                  <CardDescription>Automatically close notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Auto Dismiss</Label>
                    <Switch
                      checked={localPrefs.autoDismiss}
                      onCheckedChange={(checked) => handleUpdate({ autoDismiss: checked })}
                    />
                  </div>

                  {localPrefs.autoDismiss && (
                    <div>
                      <Label>Duration: {localPrefs.autoDismissDuration / 1000}s</Label>
                      <Slider
                        value={[localPrefs.autoDismissDuration]}
                        onValueChange={([value]) => handleUpdate({ autoDismissDuration: value })}
                        min={1000}
                        max={30000}
                        step={1000}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Max Notifications</CardTitle>
                  <CardDescription>{localPrefs.maxNotifications} notifications at once</CardDescription>
                </CardHeader>
                <CardContent>
                  <Slider
                    value={[localPrefs.maxNotifications]}
                    onValueChange={([value]) => handleUpdate({ maxNotifications: value })}
                    min={1}
                    max={10}
                    step={1}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stack Behavior</CardTitle>
                  <CardDescription>How multiple notifications are displayed</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={localPrefs.stackBehavior}
                    onValueChange={(value) => handleUpdate({ stackBehavior: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STACK">Stack (show all)</SelectItem>
                      <SelectItem value="REPLACE">Replace (newest only)</SelectItem>
                      <SelectItem value="QUEUE">Queue (show one at a time)</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Types</CardTitle>
                  <CardDescription>Enable/disable notification types</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Info Notifications</Label>
                    <Switch
                      checked={localPrefs.enableInfo}
                      onCheckedChange={(checked) => handleUpdate({ enableInfo: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Success Notifications</Label>
                    <Switch
                      checked={localPrefs.enableSuccess}
                      onCheckedChange={(checked) => handleUpdate({ enableSuccess: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Warning Notifications</Label>
                    <Switch
                      checked={localPrefs.enableWarning}
                      onCheckedChange={(checked) => handleUpdate({ enableWarning: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Error Notifications</Label>
                    <Switch
                      checked={localPrefs.enableError}
                      onCheckedChange={(checked) => handleUpdate({ enableError: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Grouping</CardTitle>
                  <CardDescription>Group similar notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Group Similar</Label>
                    <Switch
                      checked={localPrefs.groupSimilar}
                      onCheckedChange={(checked) => handleUpdate({ groupSimilar: checked })}
                    />
                  </div>

                  {localPrefs.groupSimilar && (
                    <div>
                      <Label>Grouping Window: {localPrefs.groupingWindow / 1000}s</Label>
                      <Slider
                        value={[localPrefs.groupingWindow]}
                        onValueChange={([value]) => handleUpdate({ groupingWindow: value })}
                        min={10000}
                        max={300000}
                        step={10000}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quiet Tab */}
            <TabsContent value="quiet" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Do Not Disturb</CardTitle>
                  <CardDescription>Disable all notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Label>Enable Do Not Disturb</Label>
                    <Switch
                      checked={localPrefs.doNotDisturb}
                      onCheckedChange={(checked) => handleUpdate({ doNotDisturb: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quiet Hours</CardTitle>
                  <CardDescription>Disable notifications during specific hours</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Quiet Hours</Label>
                    <Switch
                      checked={localPrefs.quietHoursEnabled}
                      onCheckedChange={(checked) => handleUpdate({ quietHoursEnabled: checked })}
                    />
                  </div>

                  {localPrefs.quietHoursEnabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={localPrefs.quietHoursStart || "22:00"}
                          onChange={(e) => handleUpdate({ quietHoursStart: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={localPrefs.quietHoursEnd || "08:00"}
                          onChange={(e) => handleUpdate({ quietHoursEnd: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>Test your notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => handleTestNotification("INFO")}
                variant="outline"
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Test Info
              </Button>
              <Button
                onClick={() => handleTestNotification("SUCCESS")}
                variant="outline"
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Test Success
              </Button>
              <Button
                onClick={() => handleTestNotification("WARNING")}
                variant="outline"
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Test Warning
              </Button>
              <Button
                onClick={() => handleTestNotification("ERROR")}
                variant="outline"
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Test Error
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Presets</CardTitle>
              <CardDescription>Quick style presets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => applyPreset("default")}
                variant="outline"
                className="w-full"
              >
                Default
              </Button>
              <Button
                onClick={() => applyPreset("minimal")}
                variant="outline"
                className="w-full"
              >
                Minimal
              </Button>
              <Button
                onClick={() => applyPreset("bold")}
                variant="outline"
                className="w-full"
              >
                Bold
              </Button>
              <Button
                onClick={() => applyPreset("subtle")}
                variant="outline"
                className="w-full"
              >
                Subtle
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import/Export</CardTitle>
              <CardDescription>Save and share your settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" disabled>
                <Download className="h-4 w-4 mr-2" />
                Export Settings
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <Upload className="h-4 w-4 mr-2" />
                Import Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
