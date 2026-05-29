export type AppModeOption = "bridge" | "simple" | "expert";

type ModeSelectionProps = {
  selectedMode: AppModeOption | null;
  onSelectMode: (mode: AppModeOption) => void;
};

export function ModeSelection({
  selectedMode,
  onSelectMode,
}: ModeSelectionProps) {
  return (
    <section className="mode-panel" aria-labelledby="mode-selection-title">
      <div className="panel-heading">
        <h2 id="mode-selection-title">Choose the level of detail</h2>
        <p className="section-copy">
          The simplified journey asks fewer questions and keeps assumptions simple.
          Switch to expert mode any time if you want every modelling control.
        </p>
      </div>

      <div className="mode-card-grid">
        <button
          type="button"
          className={getModeCardClassName(selectedMode === "simple")}
          aria-pressed={selectedMode === "simple"}
          onClick={() => onSelectMode("simple")}
        >
          <span className="card-label">Simple journey</span>
          <strong>Simplified retirement journey</strong>
          <span>
            Answer a smaller set of questions to see what your retirement could
            look like financially. This journey keeps the main assumptions simple
            and shows your projected income, key dates, and funding gaps at the
            end.
          </span>
        </button>

        <button
          type="button"
          className={getModeCardClassName(selectedMode === "bridge")}
          aria-pressed={selectedMode === "bridge"}
          onClick={() => onSelectMode("bridge")}
        >
          <span className="card-label">Early retirement</span>
          <strong>Work out what I need to retire early</strong>
          <span>
            Follow a statement-led flow that closely matches the main Civil Service
            calculator inputs, then review the full results breakdown.
          </span>
        </button>

        <button
          type="button"
          className={getModeCardClassName(selectedMode === "expert")}
          aria-pressed={selectedMode === "expert"}
          onClick={() => onSelectMode("expert")}
        >
          <span className="card-label">Expert mode</span>
          <strong>Show all settings and unlock full control.</strong>
          <span>
            Reveal every assumption, optional section, lump sum, and detailed
            projection table.
          </span>
        </button>
      </div>
    </section>
  );
}

function getModeCardClassName(isActive: boolean) {
  return ["mode-card", isActive ? "mode-card--active" : ""]
    .filter(Boolean)
    .join(" ");
}
