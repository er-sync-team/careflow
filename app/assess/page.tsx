import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { AssessmentFlow } from '@/components/assess/assessment-flow';
import { DEMO_SCENARIOS, type DemoScenarioId } from '@/lib/demo-scenarios';

export const metadata = { title: 'Assessment | CareFlow' };

export default function AssessPage({ searchParams }: { searchParams: { demo?: string } }) {
  const scenario = DEMO_SCENARIOS[searchParams.demo as DemoScenarioId];
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <AssessmentFlow key={scenario?.id ?? 'live'} scenario={scenario} />
      </main>
      <SiteFooter />
    </div>
  );
}
