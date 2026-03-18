import { AppShell } from "@/components/app-shell";
import { OnboardingWizard } from "@/components/onboarding-wizard";

export default function OnboardingPage() {
  return (
    <AppShell
      title="Onboarding"
      subtitle="Three steps: define the exam, define the subjects, then let AI split the work into actual tasks."
    >
      <OnboardingWizard />
    </AppShell>
  );
}
