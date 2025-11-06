import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, CheckCircle, XCircle, Clock, PlayCircle, PauseCircle, RefreshCw } from 'lucide-react';

type Carrier = 'FEDEX' | 'UPS' | 'USPS' | 'DHL';

export default function PortalAutomation() {
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier>('FEDEX');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCredential, setNewCredential] = useState({
    carrier: 'FEDEX' as Carrier,
    accountName: '',
    username: '',
    password: '',
    accountNumber: '',
    twoFactorMethod: 'NONE' as const,
    isShared: false,
  });

  const utils = trpc.useUtils();

  // Queries
  const { data: credentials, isLoading: credentialsLoading } = trpc.portalAutomation.getCredentials.useQuery({
    carrier: selectedCarrier,
  });

  const { data: submissionQueue, isLoading: queueLoading } = trpc.portalAutomation.getSubmissionQueue.useQuery({
    carrier: selectedCarrier,
  });

  const { data: portalConfigs } = trpc.portalAutomation.getPortalConfigs.useQuery();

  // Mutations
  const storeCredentialsMutation = trpc.portalAutomation.storeCredentials.useMutation({
    onSuccess: () => {
      toast.success('Credentials saved successfully');
      setIsAddDialogOpen(false);
      setNewCredential({
        carrier: 'FEDEX',
        accountName: '',
        username: '',
        password: '',
        accountNumber: '',
        twoFactorMethod: 'NONE',
        isShared: false,
      });
      utils.portalAutomation.getCredentials.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to save credentials: ${error.message}`);
    },
  });

  const testCredentialsMutation = trpc.portalAutomation.testCredentials.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
      utils.portalAutomation.getCredentials.invalidate();
    },
    onError: (error) => {
      toast.error(`Test failed: ${error.message}`);
    },
  });

  const deleteCredentialsMutation = trpc.portalAutomation.deleteCredentials.useMutation({
    onSuccess: () => {
      toast.success('Credentials deleted');
      utils.portalAutomation.getCredentials.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const cancelSubmissionMutation = trpc.portalAutomation.cancelSubmission.useMutation({
    onSuccess: () => {
      toast.success('Submission cancelled');
      utils.portalAutomation.getSubmissionQueue.invalidate();
    },
  });

  const retrySubmissionMutation = trpc.portalAutomation.retrySubmission.useMutation({
    onSuccess: () => {
      toast.success('Submission queued for retry');
      utils.portalAutomation.getSubmissionQueue.invalidate();
    },
  });

  const initializeConfigsMutation = trpc.portalAutomation.initializePortalConfigs.useMutation({
    onSuccess: () => {
      toast.success('Portal configurations initialized');
      utils.portalAutomation.getPortalConfigs.invalidate();
    },
  });

  const handleSaveCredentials = () => {
    storeCredentialsMutation.mutate(newCredential);
  };

  const handleTestCredentials = (credentialId: number) => {
    testCredentialsMutation.mutate({ credentialId });
  };

  const handleDeleteCredentials = (credentialId: number) => {
    if (confirm('Are you sure you want to delete these credentials?')) {
      deleteCredentialsMutation.mutate({ credentialId });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any }> = {
      VALID: { variant: 'default', icon: CheckCircle },
      INVALID: { variant: 'destructive', icon: XCircle },
      NEEDS_VERIFICATION: { variant: 'secondary', icon: Clock },
      EXPIRED: { variant: 'destructive', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.NEEDS_VERIFICATION;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getSubmissionStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any }> = {
      QUEUED: { variant: 'secondary', icon: Clock },
      IN_PROGRESS: { variant: 'default', icon: PlayCircle },
      COMPLETED: { variant: 'default', icon: CheckCircle },
      FAILED: { variant: 'destructive', icon: XCircle },
      CANCELLED: { variant: 'outline', icon: PauseCircle },
      NEEDS_CAPTCHA: { variant: 'secondary', icon: Clock },
      NEEDS_2FA: { variant: 'secondary', icon: Clock },
    };

    const config = statusConfig[status] || statusConfig.QUEUED;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Portal Automation</h1>
          <p className="text-muted-foreground">Manage carrier portal credentials and automated submissions</p>
        </div>
        <div className="flex gap-2">
          {!portalConfigs || portalConfigs.length === 0 ? (
            <Button onClick={() => initializeConfigsMutation.mutate()} disabled={initializeConfigsMutation.isPending}>
              {initializeConfigsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Initialize Portal Configs
            </Button>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="credentials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="queue">Submission Queue</TabsTrigger>
          <TabsTrigger value="config">Portal Configuration</TabsTrigger>
        </TabsList>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="space-y-4">
          <div className="flex justify-between items-center">
            <Select value={selectedCarrier} onValueChange={(value) => setSelectedCarrier(value as Carrier)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FEDEX">FedEx</SelectItem>
                <SelectItem value="UPS">UPS</SelectItem>
                <SelectItem value="USPS">USPS</SelectItem>
                <SelectItem value="DHL">DHL</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Credentials
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Portal Credentials</DialogTitle>
                  <DialogDescription>
                    Store encrypted credentials for automated portal access
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="carrier">Carrier</Label>
                    <Select
                      value={newCredential.carrier}
                      onValueChange={(value) => setNewCredential({ ...newCredential, carrier: value as Carrier })}
                    >
                      <SelectTrigger id="carrier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FEDEX">FedEx</SelectItem>
                        <SelectItem value="UPS">UPS</SelectItem>
                        <SelectItem value="USPS">USPS</SelectItem>
                        <SelectItem value="DHL">DHL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      placeholder="e.g., Main FedEx Account"
                      value={newCredential.accountName}
                      onChange={(e) => setNewCredential({ ...newCredential, accountName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newCredential.username}
                        onChange={(e) => setNewCredential({ ...newCredential, username: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newCredential.password}
                        onChange={(e) => setNewCredential({ ...newCredential, password: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="accountNumber">Account Number (Optional)</Label>
                    <Input
                      id="accountNumber"
                      placeholder="For carriers that require it"
                      value={newCredential.accountNumber}
                      onChange={(e) => setNewCredential({ ...newCredential, accountNumber: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="twoFactorMethod">Two-Factor Authentication</Label>
                    <Select
                      value={newCredential.twoFactorMethod}
                      onValueChange={(value: any) => setNewCredential({ ...newCredential, twoFactorMethod: value })}
                    >
                      <SelectTrigger id="twoFactorMethod">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">None</SelectItem>
                        <SelectItem value="SMS">SMS</SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="AUTHENTICATOR">Authenticator App</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveCredentials} disabled={storeCredentialsMutation.isPending}>
                    {storeCredentialsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Credentials
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {credentialsLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : credentials && credentials.length > 0 ? (
            <div className="grid gap-4">
              {credentials.map((cred) => (
                <Card key={cred.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{cred.accountName}</CardTitle>
                        <CardDescription>
                          {cred.carrier} • {cred.isShared ? 'Shared Account' : 'Private Account'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(cred.validationStatus)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {cred.lastValidated ? (
                          <span>Last validated: {new Date(cred.lastValidated).toLocaleString()}</span>
                        ) : (
                          <span>Never validated</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestCredentials(cred.id)}
                          disabled={testCredentialsMutation.isPending}
                        >
                          {testCredentialsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Test
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCredentials(cred.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <p className="text-muted-foreground mb-4">No credentials found for {selectedCarrier}</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Credential
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Submission Queue Tab */}
        <TabsContent value="queue" className="space-y-4">
          <div className="flex justify-between items-center">
            <Select value={selectedCarrier} onValueChange={(value) => setSelectedCarrier(value as Carrier)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FEDEX">FedEx</SelectItem>
                <SelectItem value="UPS">UPS</SelectItem>
                <SelectItem value="USPS">USPS</SelectItem>
                <SelectItem value="DHL">DHL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {queueLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : submissionQueue && submissionQueue.length > 0 ? (
            <div className="grid gap-4">
              {submissionQueue.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Case #{submission.caseId}</CardTitle>
                        <CardDescription>
                          {submission.submissionType} • Priority: {submission.priority}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {getSubmissionStatusBadge(submission.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Attempts:</span>
                        <span>{submission.attemptCount} / {submission.maxAttempts}</span>
                      </div>
                      {submission.confirmationNumber && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Confirmation:</span>
                          <span className="font-mono">{submission.confirmationNumber}</span>
                        </div>
                      )}
                      {submission.errorMessage && (
                        <div className="text-sm text-destructive">
                          Error: {submission.errorMessage}
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        {submission.status === 'QUEUED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelSubmissionMutation.mutate({ submissionId: submission.id })}
                          >
                            Cancel
                          </Button>
                        )}
                        {submission.status === 'FAILED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => retrySubmissionMutation.mutate({ submissionId: submission.id })}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <p className="text-muted-foreground">No submissions in queue for {selectedCarrier}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Portal Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          {portalConfigs && portalConfigs.length > 0 ? (
            <div className="grid gap-4">
              {portalConfigs.map((config) => (
                <Card key={config.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{config.carrier} Portal Configuration</CardTitle>
                        <CardDescription>
                          {config.isEnabled ? 'Enabled' : 'Disabled'} • 
                          {config.hasCaptcha ? ` Has CAPTCHA (${config.captchaType})` : ' No CAPTCHA'}
                        </CardDescription>
                      </div>
                      <Badge variant={config.testStatus === 'PASSED' ? 'default' : 'secondary'}>
                        {config.testStatus}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Login URL:</span>
                        <span className="font-mono text-xs">{config.loginUrl}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Claims URL:</span>
                        <span className="font-mono text-xs">{config.claimsUrl || 'Not configured'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Concurrent Sessions:</span>
                        <span>{config.maxConcurrentSessions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Session Timeout:</span>
                        <span>{config.sessionTimeout}s</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <p className="text-muted-foreground mb-4">No portal configurations found</p>
                <Button onClick={() => initializeConfigsMutation.mutate()}>
                  Initialize Default Configurations
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
