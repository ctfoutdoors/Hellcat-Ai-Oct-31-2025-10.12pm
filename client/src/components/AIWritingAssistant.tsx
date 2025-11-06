import { useState } from 'react';
import { GlassCard } from '@/components/trading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  Wand2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface AIWritingAssistantProps {
  currentContent: string;
  onInsertContent: (content: string) => void;
  caseDetails?: {
    carrier?: string;
    trackingNumber?: string;
    damageType?: string;
    claimAmount?: number;
  };
}

export default function AIWritingAssistant({
  currentContent,
  onInsertContent,
  caseDetails,
}: AIWritingAssistantProps) {
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [successRate, setSuccessRate] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [tone, setTone] = useState<'professional' | 'assertive' | 'friendly'>('professional');

  // Mock AI generation (replace with actual tRPC call)
  const generateLetter = async () => {
    setGenerating(true);
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedLetter = `
<h1>Formal Damage Claim Notice</h1>

<p>Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

<p>To: ${caseDetails?.carrier || 'Carrier'} Claims Department<br/>
Claims Processing Center<br/>
[Carrier Address]</p>

<p>From: Catch The Fever<br/>
456 Business Blvd<br/>
City, ST 12345</p>

<p><strong>Re: Formal Damage Claim - Tracking Number ${caseDetails?.trackingNumber || '[TRACKING]'}</strong></p>

<p>Dear Claims Department,</p>

<p>I am writing to file a formal damage claim for a shipment that was delivered in damaged condition. This letter serves as official notice of our claim under your published claims policy and applicable carrier liability regulations.</p>

<h2>Shipment Details</h2>
<ul>
  <li><strong>Tracking Number:</strong> ${caseDetails?.trackingNumber || '[TRACKING]'}</li>
  <li><strong>Service Type:</strong> Ground</li>
  <li><strong>Declared Value:</strong> $${(caseDetails?.claimAmount || 0) / 100}</li>
  <li><strong>Damage Type:</strong> ${caseDetails?.damageType || 'Product Damage'}</li>
</ul>

<h2>Damage Description</h2>
<p>Upon delivery, the package exhibited clear signs of mishandling during transit. The contents sustained significant damage that renders the merchandise unsellable and unfit for its intended purpose. Photographic evidence and detailed documentation are attached to support this claim.</p>

<h2>Claim Amount</h2>
<p>Based on the declared value and actual damage sustained, we are claiming the full amount of <strong>$${(caseDetails?.claimAmount || 0) / 100}</strong> for the damaged merchandise.</p>

<h2>Supporting Documentation</h2>
<p>Enclosed with this claim:</p>
<ul>
  <li>Photographic evidence of damage</li>
  <li>Original invoice and proof of value</li>
  <li>Packaging materials showing external damage</li>
  <li>Delivery receipt and tracking history</li>
</ul>

<h2>Request for Action</h2>
<p>We respectfully request:</p>
<ol>
  <li>Immediate acknowledgment of this claim with a claim reference number</li>
  <li>Full reimbursement of $${(caseDetails?.claimAmount || 0) / 100} within 30 days</li>
  <li>Written confirmation of your investigation findings</li>
</ol>

<p>Per your published claims policy, we expect a response within 10 business days. Failure to respond or resolve this matter promptly will necessitate escalation to management and potentially regulatory authorities.</p>

<p>We value our business relationship and trust this matter will be resolved professionally and expeditiously.</p>

<p>Sincerely,</p>

<p>Catch The Fever<br/>
Claims Department<br/>
456 Business Blvd<br/>
City, ST 12345<br/>
Phone: (555) 987-6543<br/>
Email: claims@catchthefever.com</p>

<p><em>CC: Customer Service Manager, Legal Department</em></p>
      `;
      
      onInsertContent(generatedLetter);
      toast.success('Letter generated successfully!');
      analyzeSuccess(generatedLetter);
    } catch (error) {
      toast.error('Failed to generate letter');
    } finally {
      setGenerating(false);
    }
  };

  const improveLetter = async () => {
    setGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuggestions([
        'Add specific delivery date for better documentation',
        'Include carrier service guarantee reference',
        'Mention specific damage severity level',
        'Add timeline for expected response',
        'Reference applicable carrier liability limits',
      ]);
      
      toast.success('Suggestions generated!');
    } catch (error) {
      toast.error('Failed to analyze letter');
    } finally {
      setGenerating(false);
    }
  };

  const adjustTone = async (newTone: 'professional' | 'assertive' | 'friendly') => {
    setGenerating(true);
    setTone(newTone);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Tone adjusted to ${newTone}`);
    } catch (error) {
      toast.error('Failed to adjust tone');
    } finally {
      setGenerating(false);
    }
  };

  const analyzeSuccess = async (content: string) => {
    setAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock success rate calculation
      let rate = 60;
      if (content.includes('formal')) rate += 10;
      if (content.includes('Tracking Number')) rate += 10;
      if (content.includes('photographic evidence')) rate += 10;
      if (content.includes('claim reference number')) rate += 10;
      
      setSuccessRate(Math.min(rate, 95));
    } catch (error) {
      console.error('Failed to analyze success rate');
    } finally {
      setAnalyzing(false);
    }
  };

  const legalPhrases = [
    { category: 'Opening', text: 'I am writing to formally notify you of...' },
    { category: 'Opening', text: 'This letter serves as official notice of...' },
    { category: 'Demand', text: 'We respectfully request immediate resolution of...' },
    { category: 'Demand', text: 'We expect full reimbursement within 30 days...' },
    { category: 'Escalation', text: 'Failure to respond will necessitate escalation to...' },
    { category: 'Escalation', text: 'We reserve all rights under applicable law...' },
    { category: 'Closing', text: 'We trust this matter will be resolved professionally...' },
    { category: 'Closing', text: 'We look forward to your prompt response...' },
  ];

  return (
    <GlassCard className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-trading-blue-400" />
        <h3 className="text-lg font-semibold">AI Writing Assistant</h3>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="improve">Improve</TabsTrigger>
          <TabsTrigger value="tone">Tone</TabsTrigger>
          <TabsTrigger value="success">Success</TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-4">
          <div className="text-sm text-trading-navy-300 mb-4">
            Generate a complete dispute letter based on case details
          </div>
          
          <Button
            className="w-full gradient-blue"
            onClick={generateLetter}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Complete Letter
              </>
            )}
          </Button>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-trading-navy-400 uppercase">
              What will be included:
            </div>
            <ul className="text-sm text-trading-navy-300 space-y-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-trading-green-400 mt-0.5 flex-shrink-0" />
                Professional header with addresses
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-trading-green-400 mt-0.5 flex-shrink-0" />
                Detailed shipment and damage information
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-trading-green-400 mt-0.5 flex-shrink-0" />
                Clear claim amount and justification
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-trading-green-400 mt-0.5 flex-shrink-0" />
                Request for specific actions
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-trading-green-400 mt-0.5 flex-shrink-0" />
                Professional closing with escalation notice
              </li>
            </ul>
          </div>
        </TabsContent>

        {/* Improve Tab */}
        <TabsContent value="improve" className="space-y-4">
          <div className="text-sm text-trading-navy-300 mb-4">
            Get AI suggestions to improve your letter
          </div>
          
          <Button
            className="w-full gradient-blue"
            onClick={improveLetter}
            disabled={generating || !currentContent}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Analyze & Improve
              </>
            )}
          </Button>

          {suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-trading-navy-400 uppercase">
                Suggestions:
              </div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg glass-hover border border-trading-navy-700"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-trading-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{suggestion}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs font-semibold text-trading-navy-400 uppercase">
              Legal Phrases Library:
            </div>
            {legalPhrases.slice(0, 4).map((phrase, index) => (
              <div
                key={index}
                className="p-2 rounded-lg glass-hover border border-trading-navy-700 cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(phrase.text);
                  toast.success('Phrase copied!');
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">
                    {phrase.category}
                  </Badge>
                  <Copy className="w-3 h-3 text-trading-navy-400" />
                </div>
                <div className="text-xs text-trading-navy-300">{phrase.text}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Tone Tab */}
        <TabsContent value="tone" className="space-y-4">
          <div className="text-sm text-trading-navy-300 mb-4">
            Adjust the tone of your letter
          </div>

          <div className="space-y-2">
            <Button
              className={`w-full ${tone === 'professional' ? 'gradient-blue' : 'glass'}`}
              variant={tone === 'professional' ? 'default' : 'outline'}
              onClick={() => adjustTone('professional')}
              disabled={generating}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Professional & Formal
            </Button>
            <Button
              className={`w-full ${tone === 'assertive' ? 'gradient-blue' : 'glass'}`}
              variant={tone === 'assertive' ? 'default' : 'outline'}
              onClick={() => adjustTone('assertive')}
              disabled={generating}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Assertive & Firm
            </Button>
            <Button
              className={`w-full ${tone === 'friendly' ? 'gradient-blue' : 'glass'}`}
              variant={tone === 'friendly' ? 'default' : 'outline'}
              onClick={() => adjustTone('friendly')}
              disabled={generating}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              Friendly & Cooperative
            </Button>
          </div>

          <div className="p-4 rounded-lg glass border border-trading-navy-700">
            <div className="text-xs font-semibold text-trading-navy-400 uppercase mb-2">
              Current Tone: {tone}
            </div>
            <div className="text-sm text-trading-navy-300">
              {tone === 'professional' && 'Formal, respectful, and business-appropriate'}
              {tone === 'assertive' && 'Firm, direct, and demanding action'}
              {tone === 'friendly' && 'Cooperative, understanding, and solution-focused'}
            </div>
          </div>
        </TabsContent>

        {/* Success Tab */}
        <TabsContent value="success" className="space-y-4">
          <div className="text-sm text-trading-navy-300 mb-4">
            Predicted success rate for this letter
          </div>

          <div className="p-6 rounded-lg glass border border-trading-navy-700 text-center">
            <div className="text-5xl font-bold gradient-text mb-2">
              {successRate}%
            </div>
            <div className="text-sm text-trading-navy-400">
              Estimated Success Rate
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-trading-navy-400">Completeness</span>
              <span className="text-foreground">85%</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-trading-navy-400">Professionalism</span>
              <span className="text-foreground">90%</span>
            </div>
            <Progress value={90} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-trading-navy-400">Legal Strength</span>
              <span className="text-foreground">75%</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>

          <div className="p-4 rounded-lg glass border border-trading-navy-700">
            <div className="text-xs font-semibold text-trading-navy-400 uppercase mb-2">
              Recommendations:
            </div>
            <ul className="text-sm text-trading-navy-300 space-y-1">
              <li>• Add specific timeline expectations</li>
              <li>• Include carrier policy references</li>
              <li>• Strengthen escalation language</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </GlassCard>
  );
}
