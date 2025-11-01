import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Camera, Upload } from 'lucide-react';

interface DamageDocumentationFormProps {
  onSubmit: (data: DamageDocumentation) => void;
  initialData?: Partial<DamageDocumentation>;
}

export interface DamageDocumentation {
  damageTypes: string[];
  damageDescription: string;
  photoUrls: string[];
  packagingDocumentation: string;
  proofOfDamageChecklist: {
    tubePhotos: boolean;
    rodPhotos: boolean;
    tipPhotos: boolean;
    bentEyePhotos: boolean;
    structuralPhotos: boolean;
    packagingPhotos: boolean;
  };
}

const damageTypeOptions = [
  { value: 'tube', label: 'Tube Damage', description: 'Damage to rod tube/case' },
  { value: 'rod', label: 'Rod Damage', description: 'Visible damage to rod blank' },
  { value: 'tip', label: 'Tip Broken', description: 'Rod tip is broken or cracked' },
  { value: 'bent_eye', label: 'Bent Eye', description: 'Guide eye is bent or damaged' },
  { value: 'structural', label: 'Structural Damage', description: 'Structural integrity compromised' },
  { value: 'other', label: 'Other Damage', description: 'Other types of damage' },
];

const DamageDocumentationForm: React.FC<DamageDocumentationFormProps> = ({
  onSubmit,
  initialData,
}) => {
  const [damageTypes, setDamageTypes] = useState<string[]>(initialData?.damageTypes || []);
  const [damageDescription, setDamageDescription] = useState(initialData?.damageDescription || '');
  const [packagingDocumentation, setPackagingDocumentation] = useState(initialData?.packagingDocumentation || '');
  const [checklist, setChecklist] = useState(initialData?.proofOfDamageChecklist || {
    tubePhotos: false,
    rodPhotos: false,
    tipPhotos: false,
    bentEyePhotos: false,
    structuralPhotos: false,
    packagingPhotos: false,
  });

  const handleDamageTypeToggle = (value: string) => {
    setDamageTypes(prev =>
      prev.includes(value)
        ? prev.filter(t => t !== value)
        : [...prev, value]
    );
  };

  const handleChecklistToggle = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = () => {
    onSubmit({
      damageTypes,
      damageDescription,
      photoUrls: [],
      packagingDocumentation,
      proofOfDamageChecklist: checklist,
    });
  };

  const completionPercentage = Math.round(
    (Object.values(checklist).filter(Boolean).length / Object.keys(checklist).length) * 100
  );

  return (
    <div className="space-y-6">
      {/* Damage Types */}
      <Card>
        <CardHeader>
          <CardTitle>Damage Type Classification</CardTitle>
          <CardDescription>
            Select all types of damage observed on the product
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {damageTypeOptions.map((option) => (
            <div key={option.value} className="flex items-start space-x-3">
              <Checkbox
                id={option.value}
                checked={damageTypes.includes(option.value)}
                onCheckedChange={() => handleDamageTypeToggle(option.value)}
              />
              <div className="flex-1">
                <Label
                  htmlFor={option.value}
                  className="font-medium cursor-pointer"
                >
                  {option.label}
                </Label>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Damage Description */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Damage Description</CardTitle>
          <CardDescription>
            Provide a detailed description of the damage observed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={damageDescription}
            onChange={(e) => setDamageDescription(e.target.value)}
            placeholder="Describe the damage in detail, including location, severity, and any other relevant information..."
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Photo Documentation Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Photo Documentation Checklist</span>
            <span className="text-sm font-normal text-muted-foreground">
              {completionPercentage}% Complete
            </span>
          </CardTitle>
          <CardDescription>
            Ensure all required photos are captured for evidence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="tubePhotos"
              checked={checklist.tubePhotos}
              onCheckedChange={() => handleChecklistToggle('tubePhotos')}
            />
            <Label htmlFor="tubePhotos" className="cursor-pointer">
              Photos of tube/case damage
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="rodPhotos"
              checked={checklist.rodPhotos}
              onCheckedChange={() => handleChecklistToggle('rodPhotos')}
            />
            <Label htmlFor="rodPhotos" className="cursor-pointer">
              Photos of rod damage (if visible)
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="tipPhotos"
              checked={checklist.tipPhotos}
              onCheckedChange={() => handleChecklistToggle('tipPhotos')}
            />
            <Label htmlFor="tipPhotos" className="cursor-pointer">
              Photos of broken tip
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="bentEyePhotos"
              checked={checklist.bentEyePhotos}
              onCheckedChange={() => handleChecklistToggle('bentEyePhotos')}
            />
            <Label htmlFor="bentEyePhotos" className="cursor-pointer">
              Photos of bent guide eyes
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="structuralPhotos"
              checked={checklist.structuralPhotos}
              onCheckedChange={() => handleChecklistToggle('structuralPhotos')}
            />
            <Label htmlFor="structuralPhotos" className="cursor-pointer">
              Photos of structural damage
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="packagingPhotos"
              checked={checklist.packagingPhotos}
              onCheckedChange={() => handleChecklistToggle('packagingPhotos')}
            />
            <Label htmlFor="packagingPhotos" className="cursor-pointer">
              Photos of packaging and spacing
            </Label>
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full gap-2">
              <Camera className="h-4 w-4" />
              Capture Photos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Packaging Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Packaging & Spacing Documentation</CardTitle>
          <CardDescription>
            Document how the product was packaged and any spacing issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={packagingDocumentation}
            onChange={(e) => setPackagingDocumentation(e.target.value)}
            placeholder="Describe the packaging materials, spacing, protection used, and any issues observed..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Completion Warning */}
      {completionPercentage < 100 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-900 dark:text-amber-100">
              Incomplete Documentation
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Complete all photo documentation items for the strongest evidence package.
            </p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Save Draft</Button>
        <Button onClick={handleSubmit} disabled={damageTypes.length === 0}>
          Save Damage Documentation
        </Button>
      </div>
    </div>
  );
};

export default DamageDocumentationForm;
