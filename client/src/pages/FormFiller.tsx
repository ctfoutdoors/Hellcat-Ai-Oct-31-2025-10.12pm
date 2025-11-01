import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { DualScreenFormFiller } from '@/components/DualScreenFormFiller';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function FormFiller() {
  const params = useParams();
  const [, navigate] = useLocation();
  const parsedId = params.id ? parseInt(params.id, 10) : NaN;
  const caseId = !isNaN(parsedId) ? parsedId : undefined;

  const { data: caseData, isLoading, error } = trpc.cases.getById.useQuery(
    { id: caseId! },
    { enabled: caseId !== undefined && caseId > 0 }
  );

  if (!caseId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No Case Selected</h2>
          <p className="text-muted-foreground mb-4">
            Please select a case to use the form filler
          </p>
          <Button onClick={() => navigate('/cases')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Case Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {error?.message || 'The requested case could not be found'}
          </p>
          <Button onClick={() => navigate('/cases')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(`/cases/${caseId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Case Detail
        </Button>
      </div>

      <DualScreenFormFiller caseData={caseData} />
    </div>
  );
}
