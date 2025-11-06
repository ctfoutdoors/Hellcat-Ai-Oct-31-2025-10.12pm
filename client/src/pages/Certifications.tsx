import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileCheck, Upload, Eye, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Certifications() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newCert, setNewCert] = useState({
    certificationName: '',
    certificationNumber: '',
    tubeDiameter: '',
    tubeLength: '',
    material: '',
    expiryDate: '',
    notes: '',
  });

  const { data: certifications, isLoading, refetch } = trpc.certifications.list.useQuery({
    search: searchQuery || undefined,
  });

  const createMutation = trpc.certifications.create.useMutation({
    onSuccess: () => {
      toast.success('Certification created successfully');
      setIsCreateDialogOpen(false);
      setNewCert({
        certificationName: '',
        certificationNumber: '',
        tubeDiameter: '',
        tubeLength: '',
        material: '',
        expiryDate: '',
        notes: '',
      });
      setSelectedFile(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create certification: ${error.message}`);
    },
  });

  const deleteMutation = trpc.certifications.delete.useMutation({
    onSuccess: () => {
      toast.success('Certification deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete certification: ${error.message}`);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCreateCertification = async () => {
    let attachmentUrl = '';
    
    if (selectedFile) {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      await new Promise((resolve) => {
        reader.onload = resolve;
      });
      
      const base64 = (reader.result as string).split(',')[1];
      
      // Upload file
      const uploadResult = await trpc.files.upload.mutate({
        fileName: selectedFile.name,
        fileData: base64,
        mimeType: selectedFile.type,
      });
      
      attachmentUrl = uploadResult.url;
    }

    createMutation.mutate({
      certificationName: newCert.certificationName,
      certificationNumber: newCert.certificationNumber,
      tubeDiameter: newCert.tubeDiameter ? parseFloat(newCert.tubeDiameter) : undefined,
      tubeLength: newCert.tubeLength ? parseFloat(newCert.tubeLength) : undefined,
      material: newCert.material || undefined,
      expiryDate: newCert.expiryDate ? new Date(newCert.expiryDate) : undefined,
      notes: newCert.notes || undefined,
      attachmentUrl: attachmentUrl || undefined,
    });
  };

  const isExpired = (date: Date | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isExpiringSoon = (date: Date | null) => {
    if (!date) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return new Date(date) < thirtyDaysFromNow && new Date(date) >= new Date();
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Rod Tube Certifications</h1>
          <p className="text-muted-foreground">
            Manage quality certifications and compliance documentation
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Certification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Certification</DialogTitle>
              <DialogDescription>
                Create a new rod tube certification record
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certName">Certification Name *</Label>
                  <Input
                    id="certName"
                    value={newCert.certificationName}
                    onChange={(e) => setNewCert({ ...newCert, certificationName: e.target.value })}
                    placeholder="ISO 9001:2015"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certNumber">Certification Number *</Label>
                  <Input
                    id="certNumber"
                    value={newCert.certificationNumber}
                    onChange={(e) => setNewCert({ ...newCert, certificationNumber: e.target.value })}
                    placeholder="CERT-2025-001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="diameter">Tube Diameter (inches)</Label>
                  <Input
                    id="diameter"
                    type="number"
                    step="0.125"
                    value={newCert.tubeDiameter}
                    onChange={(e) => setNewCert({ ...newCert, tubeDiameter: e.target.value })}
                    placeholder="2.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="length">Tube Length (inches)</Label>
                  <Input
                    id="length"
                    type="number"
                    step="1"
                    value={newCert.tubeLength}
                    onChange={(e) => setNewCert({ ...newCert, tubeLength: e.target.value })}
                    placeholder="48"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Input
                    id="material"
                    value={newCert.material}
                    onChange={(e) => setNewCert({ ...newCert, material: e.target.value })}
                    placeholder="PVC, Aluminum, etc."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={newCert.expiryDate}
                  onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newCert.notes}
                  onChange={(e) => setNewCert({ ...newCert, notes: e.target.value })}
                  placeholder="Additional certification details..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Certification Document (PDF/Image)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="flex-1"
                  />
                  {selectedFile && (
                    <Badge variant="secondary">
                      {selectedFile.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCertification} 
                disabled={!newCert.certificationName || !newCert.certificationNumber}
              >
                Create Certification
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Certifications</CardTitle>
          <CardDescription>Find certifications by name or number</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by certification name or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certifications</CardTitle>
          <CardDescription>
            {certifications?.length || 0} certification{certifications?.length !== 1 ? 's' : ''} on record
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading certifications...</div>
          ) : !certifications || certifications.length === 0 ? (
            <div className="text-center py-8">
              <FileCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No certifications found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first certification to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certification</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Tube Specs</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certifications.map((cert: any) => (
                  <TableRow key={cert.id}>
                    <TableCell className="font-medium">{cert.certificationName}</TableCell>
                    <TableCell className="font-mono text-sm">{cert.certificationNumber}</TableCell>
                    <TableCell>
                      {cert.tubeDiameter && cert.tubeLength
                        ? `${cert.tubeDiameter}" × ${cert.tubeLength}"`
                        : cert.tubeDiameter
                        ? `${cert.tubeDiameter}" dia.`
                        : '-'}
                    </TableCell>
                    <TableCell>{cert.material || '-'}</TableCell>
                    <TableCell>
                      {cert.expiryDate 
                        ? new Date(cert.expiryDate).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {isExpired(cert.expiryDate) ? (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Expired
                        </Badge>
                      ) : isExpiringSoon(cert.expiryDate) ? (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Expiring Soon
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Valid</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {cert.attachmentUrl && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(cert.attachmentUrl, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this certification?')) {
                              deleteMutation.mutate({ id: cert.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
