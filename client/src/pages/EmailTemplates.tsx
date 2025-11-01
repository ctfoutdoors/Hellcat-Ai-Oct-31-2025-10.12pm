import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Mail, Palette, Save, RotateCcw } from "lucide-react";

export default function EmailTemplates() {

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const { data: settings, isLoading, refetch } = trpc.emailTemplates.getSettings.useQuery();
  const updateMutation = trpc.emailTemplates.updateSettings.useMutation();
  const resetMutation = trpc.emailTemplates.resetToDefaults.useMutation();
  const testEmailMutation = trpc.emailTemplates.sendTestEmail.useMutation();
  
  const [formData, setFormData] = useState({
    companyName: "",
    logoUrl: "",
    primaryColor: "#2c5f2d",
    secondaryColor: "#10b981",
    headerText: "",
    headerIcon: "",
    footerText: "",
    introText: "",
    ctaButtonText: "",
    ctaButtonColor: "#2c5f2d",
    fromName: "",
    fromEmail: "",
    replyToEmail: "",
    enableNewCaseNotifications: true,
    enableBulkNotifications: true,
    enableStatusChangeNotifications: false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || "",
        logoUrl: settings.logoUrl || "",
        primaryColor: settings.primaryColor || "#2c5f2d",
        secondaryColor: settings.secondaryColor || "#10b981",
        headerText: settings.headerText || "",
        headerIcon: settings.headerIcon || "",
        footerText: settings.footerText || "",
        introText: settings.introText || "",
        ctaButtonText: settings.ctaButtonText || "",
        ctaButtonColor: settings.ctaButtonColor || "#2c5f2d",
        fromName: settings.fromName || "",
        fromEmail: settings.fromEmail || "",
        replyToEmail: settings.replyToEmail || "",
        enableNewCaseNotifications: settings.enableNewCaseNotifications === 1,
        enableBulkNotifications: settings.enableBulkNotifications === 1,
        enableStatusChangeNotifications: settings.enableStatusChangeNotifications === 1,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        ...formData,
        logoUrl: formData.logoUrl || null,
        footerText: formData.footerText || null,
        introText: formData.introText || null,
        fromName: formData.fromName || null,
        fromEmail: formData.fromEmail || null,
        replyToEmail: formData.replyToEmail || null,
      });
      
      toast.success("Settings saved", {
        description: "Email template settings have been updated successfully.",
      });
      
      refetch();
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to save settings",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset to default settings? This cannot be undone.")) {
      return;
    }

    try {
      await resetMutation.mutateAsync();
      toast.success("Settings reset", {
        description: "Email template settings have been reset to defaults.",
      });
      refetch();
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to reset settings",
      });
    }
  };

  const handleTestEmail = async () => {
    const email = prompt("Enter email address to send test email:");
    if (!email) return;

    setIsTesting(true);
    try {
      await testEmailMutation.mutateAsync({ recipientEmail: email });
      toast.success("Test email sent", {
        description: `A test email has been sent to ${email}`,
      });
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to send test email",
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Email Template Settings</h1>
        <p className="text-gray-600 mt-2">Customize the branding and content of automated email notifications</p>
      </div>

      <div className="space-y-6">
        {/* Branding Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Branding
            </CardTitle>
            <CardDescription>Customize your company branding in emails</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Catch The Fever"
              />
            </div>

            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-sm text-gray-500 mt-1">Recommended size: 200x60px</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    placeholder="#2c5f2d"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    placeholder="#10b981"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Content
            </CardTitle>
            <CardDescription>Customize email headers, buttons, and text</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="headerText">Header Text</Label>
                <Input
                  id="headerText"
                  value={formData.headerText}
                  onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                  placeholder="New Draft Case Created"
                />
              </div>

              <div>
                <Label htmlFor="headerIcon">Header Icon (Emoji)</Label>
                <Input
                  id="headerIcon"
                  value={formData.headerIcon}
                  onChange={(e) => setFormData({ ...formData, headerIcon: e.target.value })}
                  placeholder="🚨"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="introText">Introduction Text (Optional)</Label>
              <Textarea
                id="introText"
                value={formData.introText}
                onChange={(e) => setFormData({ ...formData, introText: e.target.value })}
                placeholder="Leave empty to use default text"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ctaButtonText">Button Text</Label>
                <Input
                  id="ctaButtonText"
                  value={formData.ctaButtonText}
                  onChange={(e) => setFormData({ ...formData, ctaButtonText: e.target.value })}
                  placeholder="Review Case"
                />
              </div>

              <div>
                <Label htmlFor="ctaButtonColor">Button Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="ctaButtonColor"
                    type="color"
                    value={formData.ctaButtonColor}
                    onChange={(e) => setFormData({ ...formData, ctaButtonColor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.ctaButtonColor}
                    onChange={(e) => setFormData({ ...formData, ctaButtonColor: e.target.value })}
                    placeholder="#2c5f2d"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="footerText">Footer Text (Optional)</Label>
              <Textarea
                id="footerText"
                value={formData.footerText}
                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                placeholder="Leave empty to use default footer"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
            <CardDescription>Configure sender information and notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fromName">From Name (Optional)</Label>
              <Input
                id="fromName"
                value={formData.fromName}
                onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                placeholder="Carrier Dispute System"
              />
            </div>

            <div>
              <Label htmlFor="fromEmail">From Email (Optional)</Label>
              <Input
                id="fromEmail"
                type="email"
                value={formData.fromEmail}
                onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                placeholder="noreply@catchthefever.com"
              />
            </div>

            <div>
              <Label htmlFor="replyToEmail">Reply-To Email (Optional)</Label>
              <Input
                id="replyToEmail"
                type="email"
                value={formData.replyToEmail}
                onChange={(e) => setFormData({ ...formData, replyToEmail: e.target.value })}
                placeholder="support@catchthefever.com"
              />
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableNewCase">New Case Notifications</Label>
                  <p className="text-sm text-gray-500">Send email when new draft cases are created</p>
                </div>
                <Switch
                  id="enableNewCase"
                  checked={formData.enableNewCaseNotifications}
                  onCheckedChange={(checked) => setFormData({ ...formData, enableNewCaseNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableBulk">Bulk Notifications</Label>
                  <p className="text-sm text-gray-500">Send email for multiple cases at once</p>
                </div>
                <Switch
                  id="enableBulk"
                  checked={formData.enableBulkNotifications}
                  onCheckedChange={(checked) => setFormData({ ...formData, enableBulkNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableStatus">Status Change Notifications</Label>
                  <p className="text-sm text-gray-500">Send email when case status changes</p>
                </div>
                <Switch
                  id="enableStatus"
                  checked={formData.enableStatusChangeNotifications}
                  onCheckedChange={(checked) => setFormData({ ...formData, enableStatusChangeNotifications: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>

          <Button onClick={handleTestEmail} variant="outline" disabled={isTesting}>
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Test Email
              </>
            )}
          </Button>

          <Button onClick={handleReset} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}
