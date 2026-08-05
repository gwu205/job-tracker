import { LookbackPeriodSection } from './LookbackPeriodSection'
import { DataManagementSection } from './DataManagementSection'
import { AISettingsSection } from '../ai/AISettingsSection'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-hairline pb-lg">
      <h2 className="mb-sm font-display text-base font-semibold text-ink">{title}</h2>
      {children}
    </section>
  )
}

export function SettingsPage() {
  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto px-lg py-md">
      <div className="mx-auto flex max-w-2xl flex-col gap-lg">
        <Section title="Job hunt period">
          <LookbackPeriodSection />
        </Section>
        <Section title="AI-assisted entry">
          <AISettingsSection />
        </Section>
        <section className="pb-lg">
          <h2 className="mb-sm font-display text-base font-semibold text-ink">Data management</h2>
          <DataManagementSection />
        </section>
      </div>
    </div>
  )
}
