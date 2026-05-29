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
