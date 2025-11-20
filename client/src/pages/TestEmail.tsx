import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";

/**
 * Test Email Page
 * Demonstrates the email tracking, activity logging, and evidence storage system
 */
export default function TestEmail() {
  const [email, setEmail] = useState("herve@catchthefever.com");
  const [result, setResult] = useState<any>(null);
  
  const sendTestEmail = trpc.cases.sendTestEmail.useMutation({
    onSuccess: (data) => {
      setResult({ success: true, data });
    },
    onError: (error) => {
      setResult({ success: false, error: error.message });
    },
  });

  const handleSend = () => {
    setResult(null);
    sendTestEmail.mutate({ recipientEmail: email });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Test Email System
            </CardTitle>
            <CardDescription>
              Send a test email to demonstrate the complete email tracking, activity logging, and evidence storage workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Recipient Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={sendTestEmail.isPending}
              />
              <p className="text-sm text-muted-foreground">
                The test email will be sent to this address
              </p>
            </div>

            <Button
              onClick={handleSend}
              disabled={sendTestEmail.isPending || !email}
              className="w-full"
              size="lg"
            >
              {sendTestEmail.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Test Email...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {result.success ? (
                    <div className="space-y-2">
                      <p className="font-semibold">{result.data.message}</p>
                      <div className="text-sm space-y-1">
                        <p>✅ Message ID: {result.data.messageId}</p>
                        {result.data.evidenceUrl && (
                          <p>✅ Evidence stored in S3</p>
                        )}
                        {result.data.googleDriveBackup && (
                          <p>✅ Backed up to Google Drive</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p>Error: {result.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-sm">What this demonstrates:</h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Email sent via Gmail integration</li>
                <li>Automatic activity logging to case records</li>
                <li>Evidence storage in S3 (JSON format)</li>
                <li>Google Drive backup for long-term archival</li>
                <li>Message ID tracking for threading</li>
                <li>Complete audit trail for dispute documentation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
