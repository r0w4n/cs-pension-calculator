import type { ReactNode, RefObject } from "react";

type JourneySectionProps = {
  activeModeRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
};

export function JourneySection({ activeModeRef, children }: JourneySectionProps) {
  return (
    <div ref={activeModeRef} className="active-mode-region" tabIndex={-1}>
      {children}
    </div>
  );
}

type GuidanceNotesToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function GuidanceNotesToggle({
  checked,
  onChange,
}: GuidanceNotesToggleProps) {
  return (
    <label className="guidance-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>Show guidance notes</span>
    </label>
  );
}
