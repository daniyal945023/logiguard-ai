import { ListChecks, Target } from 'lucide-react';

import { RiskBadge, RiskScoreMeter } from '@/components/common/RiskBadge';
import { SectionCard } from '@/components/common/SectionCard';
import { Card } from '@/components/ui/card';
import { formatShortDateTime } from '@/lib/format';
import type { AiAssessment } from '@/types/logistics';

interface AssessmentPanelProps {
  assessment: AiAssessment | undefined;
}

export function AssessmentPanel({ assessment }: AssessmentPanelProps) {
  if (!assessment) {
    return (
      <SectionCard title="AI risk assessment" description="No assessment has been generated for this exception yet.">
        <p className="text-sm text-muted-foreground">Assessments are generated automatically when a shipment is flagged.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="AI risk assessment"
      description={`${assessment.id} · generated ${formatShortDateTime(assessment.generatedAt)} · ${assessment.modelVersion}`}
      action={<RiskBadge level={assessment.riskLevel} />}
    >
      <div className="space-y-6">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Risk score</p>
          <RiskScoreMeter score={assessment.riskScore} level={assessment.riskLevel} />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Summary</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{assessment.summary}</p>
        </div>

        <Card className="border-border bg-background/60 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Target className="h-4 w-4 text-orange-300" aria-hidden="true" />
            Business impact
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{assessment.businessImpact}</p>
        </Card>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />
            Recommended actions
          </div>
          <ol className="space-y-2.5">
            {assessment.recommendedActions.map((action, index) => (
              <li key={action} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </SectionCard>
  );
}
