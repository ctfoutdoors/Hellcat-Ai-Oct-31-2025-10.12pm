import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, FileImage, Loader2, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { storagePut } from '@/lib/storage';

export default function ScreenshotOCR() {
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('text');

  const extractTextMutation = trpc.screenshotOCR.extractText.useMutation();
  const extractTrackingMutation = trpc.screenshotOCR.extractTrackingData.useMutation();
  const extractInvoiceMutation = trpc.screenshotOCR.extractInvoiceData.useMutation();
  const identifyTypeMutation = trpc.screenshotOCR.identifyDocumentType.useMutation();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      const result = await storagePut(
        `screenshots/${Date.now()}-${file.name}`,
        buffer,
        file.type
      );

      setImageUrl(result.url);
      toast.success('Image uploaded successfully');

      // Auto-identify document type
      identifyTypeMutation.mutate({ imageUrl: result.url });
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleExtractText = () => {
    if (!imageUrl) {
      toast.error('Please upload an image first');
      return;
    }
    extractTextMutation.mutate({ imageUrl });
  };

  const handleExtractTracking = () => {
    if (!imageUrl) {
      toast.error('Please upload an image first');
      return;
    }
    extractTrackingMutation.mutate({ imageUrl });
  };

  const handleExtractInvoice = () => {
    if (!imageUrl) {
      toast.error('Please upload an image first');
      return;
    }
    extractInvoiceMutation.mutate({ imageUrl });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Screenshot OCR</h1>
          <p className="text-gray-400">
            Extract text and structured data from carrier portal screenshots
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="bg-[#0a0e1a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Upload Screenshot</CardTitle>
              <CardDescription className="text-gray-400">
                Upload an image to extract data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="image-upload" className="text-gray-300">
                    Image File
                  </Label>
                  <div className="mt-2">
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer hover:border-gray-600 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploading ? (
                          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                        ) : (
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        )}
                        <p className="text-sm text-gray-400">
                          {uploading ? 'Uploading...' : 'Click to upload image'}
                        </p>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>

                {imageUrl && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Preview</Label>
                    <div className="relative rounded-lg overflow-hidden border border-gray-700">
                      <img
                        src={imageUrl}
                        alt="Uploaded screenshot"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                )}

                {identifyTypeMutation.data && (
                  <div className="flex items-center gap-2">
                    <FileImage className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-gray-300">Detected:</span>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                      {identifyTypeMutation.data.type}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      ({Math.round((identifyTypeMutation.data.confidence || 0) * 100)}% confidence)
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Extraction Results */}
          <Card className="bg-[#0a0e1a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Extraction Results</CardTitle>
              <CardDescription className="text-gray-400">
                Choose extraction method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-[#0f1419] border-gray-700">
                  <TabsTrigger value="text">Text</TabsTrigger>
                  <TabsTrigger value="tracking">Tracking</TabsTrigger>
                  <TabsTrigger value="invoice">Invoice</TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="mt-4">
                  <div className="space-y-4">
                    <Button
                      onClick={handleExtractText}
                      disabled={!imageUrl || extractTextMutation.isPending}
                      className="w-full"
                    >
                      {extractTextMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Extract Text
                    </Button>

                    {extractTextMutation.data?.success && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-300">Extracted Text</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(extractTextMutation.data.text || '')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="p-4 rounded-lg bg-[#0f1419] border border-gray-700">
                          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                            {extractTextMutation.data.text}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="tracking" className="mt-4">
                  <div className="space-y-4">
                    <Button
                      onClick={handleExtractTracking}
                      disabled={!imageUrl || extractTrackingMutation.isPending}
                      className="w-full"
                    >
                      {extractTrackingMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Extract Tracking Data
                    </Button>

                    {extractTrackingMutation.data?.success && extractTrackingMutation.data.data && (
                      <div className="space-y-3">
                        {Object.entries(extractTrackingMutation.data.data).map(([key, value]) => {
                          if (!value) return null;
                          return (
                            <div key={key} className="flex items-start justify-between p-3 rounded-lg bg-[#0f1419] border border-gray-700">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </div>
                                <div className="text-sm text-white font-mono">
                                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(String(value))}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="invoice" className="mt-4">
                  <div className="space-y-4">
                    <Button
                      onClick={handleExtractInvoice}
                      disabled={!imageUrl || extractInvoiceMutation.isPending}
                      className="w-full"
                    >
                      {extractInvoiceMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Extract Invoice Data
                    </Button>

                    {extractInvoiceMutation.data?.success && extractInvoiceMutation.data.data && (
                      <div className="space-y-3">
                        {Object.entries(extractInvoiceMutation.data.data).map(([key, value]) => {
                          if (!value) return null;
                          return (
                            <div key={key} className="p-3 rounded-lg bg-[#0f1419] border border-gray-700">
                              <div className="text-xs text-gray-500 mb-1">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </div>
                              <div className="text-sm text-white font-mono">
                                {typeof value === 'object' ? (
                                  <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(value, null, 2)}
                                  </pre>
                                ) : (
                                  String(value)
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
