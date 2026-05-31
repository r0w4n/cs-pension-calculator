import type { RefObject } from "react";
import type { PensionSettings } from "../settings";
import type { JourneyDefinition } from "../app-domains";
import {
  JourneyStepContent,
  type JourneyStepViewModel,
} from "./journey-step-content";
import { JourneyFlow as JourneyFlowFeature, JourneySection } from "./journey";

export type JourneyMode = "bridge" | "simple";

type JourneyModeScreenProps = {
  activeModeRef: RefObject<HTMLDivElement | null>;
  mode: JourneyMode;
  journey: JourneyDefinition;
  settings: PensionSettings;
  showGuidanceNotes: boolean;
  onShowGuidanceNotesChange: (checked: boolean) => void;
  journeyStepViewModel: JourneyStepViewModel;
};

export function JourneyModeScreen({
  activeModeRef,
  mode,
  journey,
  settings,
  showGuidanceNotes,
  onShowGuidanceNotesChange,
  journeyStepViewModel,
}: JourneyModeScreenProps) {
  return (
    <JourneySection activeModeRef={activeModeRef}>
      <JourneyFlowFeature
        key={mode}
        journey={journey}
        settings={settings}
        showGuidanceNotes={showGuidanceNotes}
        onShowGuidanceNotesChange={onShowGuidanceNotesChange}
        renderStepContent={(step) => (
          <JourneyStepContent step={step} viewModel={journeyStepViewModel} />
        )}
      />
    </JourneySection>
  );
}
