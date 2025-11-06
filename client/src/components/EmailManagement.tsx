import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mail, Plus, Trash2, TestTube, CheckCircle, XCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function EmailManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountName: "",
    emailAddress: "",
    provider: "SMTP" as "SMTP" | "GMAIL_API" | "ZOHO",
    smtpHost: "",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    smtpSecure: true,
    isDefault: false,
  });

  const { data: emailAccounts, refetch } = trpc.email.listAccounts.useQuery();
  const createAccountMutation = trpc.email.createAccount.useMutation();
  const testAccountMutation = trpc.email.testAccount.useMutation();

  const handleAddAccount = async () => {
    try {
      await createAccountMutation.mutateAsync(newAccount);
      toast.success("Email account added successfully");
      setIsAddDialogOpen(false);
      setNewAccount({
        accountName: "",
        emailAddress: "",
        provider: "SMTP",
        smtpHost: "",
        smtpPort: 587,
        smtpUsername: "",
        smtpPassword: "",
        smtpSecure: true,
        isDefault: false,
      });
      refetch();
    } catch (error: any) {
      toast.error(`Failed to add email account: ${error.message}`);
    }
  };

  const handleTestAccount = async (accountId: number) => {
    try {
      toast.info("Testing email account...");
      const result = await testAccountMutation.mutateAsync({ accountId });
      if (result.success) {
        toast.success("Email account test successful!");
      } else {
        toast.error(`Email account test failed: ${result.error || "Unknown error"}`);
      }
    } catch (error: any) {
      toast.error(`Test failed: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Email Accounts</CardTitle>
            <CardDescription>
              Manage email accounts for sending dispute letters and communications
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Email Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Email Account</DialogTitle>
                <DialogDescription>
                  Configure a new email account for sending dispute letters
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      placeholder="e.g., Zoho Support, Personal Gmail"
                      value={newAccount.accountName}
                      onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailAddress">Email Address</Label>
                    <Input
                      id="emailAddress"
                      type="email"
                      placeholder="your@email.com"
                      value={newAccount.emailAddress}
                      onChange={(e) => setNewAccount({ ...newAccount, emailAddress: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select
                    value={newAccount.provider}
                    onValueChange={(value: any) => setNewAccount({ ...newAccount, provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMTP">SMTP (Generic)</SelectItem>
                      <SelectItem value="GMAIL_API">Gmail API</SelectItem>
                      <SelectItem value="ZOHO">Zoho Mail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newAccount.provider === "SMTP" && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="smtpHost">SMTP Host</Label>
                        <Input
                          id="smtpHost"
                          placeholder="smtp.gmail.com"
                          value={newAccount.smtpHost}
                          onChange={(e) => setNewAccount({ ...newAccount, smtpHost: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpPort">Port</Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          placeholder="587"
                          value={newAccount.smtpPort}
                          onChange={(e) => setNewAccount({ ...newAccount, smtpPort: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtpUsername">Username</Label>
                        <Input
                          id="smtpUsername"
                          placeholder="your@email.com"
                          value={newAccount.smtpUsername}
                          onChange={(e) => setNewAccount({ ...newAccount, smtpUsername: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpPassword">Password</Label>
                        <Input
                          id="smtpPassword"
                          type="password"
                          placeholder="••••••••"
                          value={newAccount.smtpPassword}
                          onChange={(e) => setNewAccount({ ...newAccount, smtpPassword: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="smtpSecure"
                        checked={newAccount.smtpSecure}
                        onCheckedChange={(checked) => setNewAccount({ ...newAccount, smtpSecure: checked })}
                      />
                      <Label htmlFor="smtpSecure">Use TLS/SSL</Label>
                    </div>
                  </>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDefault"
                    checked={newAccount.isDefault}
                    onCheckedChange={(checked) => setNewAccount({ ...newAccount, isDefault: checked })}
                  />
                  <Label htmlFor="isDefault">Set as default email account</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAccount} disabled={createAccountMutation.isPending}>
                  {createAccountMutation.isPending ? "Adding..." : "Add Account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!emailAccounts || emailAccounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No email accounts configured</p>
            <p className="text-sm">Add an email account to send dispute letters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {emailAccounts.map((account: any) => (
              <div key={account.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{account.accountName}</h3>
                      {account.isDefault === 1 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                      {account.isActive === 1 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{account.emailAddress}</p>
                    <p className="text-xs text-muted-foreground">
                      Provider: {account.provider}
                      {account.provider === "SMTP" && ` • ${account.smtpHost}:${account.smtpPort}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestAccount(account.id)}
                      disabled={testAccountMutation.isPending}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
