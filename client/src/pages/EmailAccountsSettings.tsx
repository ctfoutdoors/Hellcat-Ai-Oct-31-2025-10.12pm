import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Mail, Plus, Trash2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function EmailAccountsSettings() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newIsPrimary, setNewIsPrimary] = useState(false);

  const { data: accounts = [], isLoading } = trpc.emailAccounts.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.emailAccounts.create.useMutation({
    onSuccess: () => {
      utils.emailAccounts.list.invalidate();
      setShowAddForm(false);
      setNewEmail("");
      setNewDisplayName("");
      setNewIsPrimary(false);
      toast.success("Email account added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add account: ${error.message}`);
    },
  });

  const setPrimaryMutation = trpc.emailAccounts.setPrimary.useMutation({
    onSuccess: () => {
      utils.emailAccounts.list.invalidate();
      toast.success("Primary account updated");
    },
  });

  const deleteMutation = trpc.emailAccounts.delete.useMutation({
    onSuccess: () => {
      utils.emailAccounts.list.invalidate();
      toast.success("Email account removed");
    },
  });

  const handleAddAccount = async () => {
    if (!newEmail.trim()) {
      toast.error("Email address is required");
      return;
    }

    await createMutation.mutateAsync({
      email: newEmail.trim(),
      displayName: newDisplayName.trim() || undefined,
      provider: "gmail",
      isPrimary: newIsPrimary,
      mcpServerName: "gmail", // Default to the configured Gmail MCP server
    });
  };

  const handleSetPrimary = async (id: number) => {
    await setPrimaryMutation.mutateAsync({ id });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to remove this email account?")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading email accounts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Accounts</h1>
          <p className="text-muted-foreground mt-2">
            Manage email accounts for case communications
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Email Account</CardTitle>
            <CardDescription>
              Add a Gmail account for sending and receiving case-related emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="disputes@catchthefever.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name (Optional)</Label>
              <Input
                id="displayName"
                placeholder="Catch The Fever Disputes"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPrimary"
                checked={newIsPrimary}
                onCheckedChange={setNewIsPrimary}
              />
              <Label htmlFor="isPrimary" className="cursor-pointer">
                Set as primary account for case communications
              </Label>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-200">
                  <p className="font-semibold mb-1">Authentication Required</p>
                  <p>
                    After adding this account, you'll need to authenticate with Google
                    to grant access for sending and receiving emails. The Gmail MCP
                    integration will handle the OAuth flow.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddAccount} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Account"}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No email accounts configured yet.
                <br />
                Add an account to start sending case communications.
              </p>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{account.email}</h3>
                      {account.isPrimary && (
                        <Badge variant="default" className="gap-1">
                          <Check className="h-3 w-3" />
                          Primary
                        </Badge>
                      )}
                      {!account.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    {account.displayName && (
                      <p className="text-sm text-muted-foreground">
                        {account.displayName}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Provider: {account.provider} • MCP: {account.mcpServerName || "Not configured"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!account.isPrimary && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetPrimary(account.id)}
                      disabled={setPrimaryMutation.isPending}
                    >
                      Set as Primary
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(account.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>Primary Account:</strong> Used by default for sending dispute letters and case communications
          </p>
          <p>
            • <strong>Multiple Accounts:</strong> Add different accounts for different purposes (disputes, support, notifications)
          </p>
          <p>
            • <strong>Gmail Integration:</strong> Uses Gmail MCP for secure OAuth authentication
          </p>
          <p>
            • <strong>Easy Switching:</strong> Change the primary account anytime with one click
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
