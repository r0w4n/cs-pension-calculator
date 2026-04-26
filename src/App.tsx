import { useEffect, useState } from "react";
import { createProjectionTable, type ProjectionRow } from "./projection";
import {
  createDefaultSettings,
  formatCurrency,
  loadStoredSettings,
  normalizeSetting,
  saveSettings,
  type PensionSettings,
} from "./settings";

type DateField = {
  id:
    | "startDate"
    | "dateOfBirth"
    | "statePensionDrawDate"
    | "alphaPensionAbsDate";
  label: string;
  type: "date";
};

type RangeField = {
  id:
    | "lifeExpectancy"
    | "normalPensionAge"
    | "earlyRetirementAge"
    | "targetPension"
    | "currentStatePension"
    | "sippPensionDrawAge"
    | "alphaAddedPensionMonthly"
    | "alphaPensionLeaveAge"
    | "accruedPensionAtLastAbs"
    | "pensionableEarnings"
    | "alphaPensionDrawAge";
  label: string;
  type: "range";
  min: number;
  max: number;
  step: number;
  format?: "currency";
  valuePrefix?: string;
};

type FieldDefinition = DateField | RangeField;

type FieldGroup = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  fields: FieldDefinition[];
};

const fieldGroups: FieldGroup[] = [
  {
    id: "personal",
    eyebrow: "Personal Details",
    title: "Personal details",
    description: "Core personal dates and assumptions used across the calculator.",
    fields: [
      {
        id: "startDate",
        label: "Calculation Start Date",
        type: "date",
      },
      {
        id: "dateOfBirth",
        label: "Your Date of Birth",
        type: "date",
      },
      {
        id: "lifeExpectancy",
        label: "Assumed Life Expectancy (Age)",
        type: "range",
        min: 75,
        max: 100,
        step: 1,
      },
    ],
  },
  {
    id: "pension",
    eyebrow: "Pension Details",
    title: "Wider pension details",
    description: "Main retirement ages and total pension income assumptions.",
    fields: [
      {
        id: "normalPensionAge",
        label: "Your Normal Pension Age",
        type: "range",
        min: 65,
        max: 70,
        step: 1,
      },
      {
        id: "earlyRetirementAge",
        label: "Planned Early Retirement Age",
        type: "range",
        min: 55,
        max: 85,
        step: 1,
      },
      {
        id: "targetPension",
        label: "Target Total Pension Income (£ per year)",
        type: "range",
        min: 12000,
        max: 90000,
        step: 500,
        format: "currency",
      },
      {
        id: "currentStatePension",
        label: "Current Full State Pension (£ per year)",
        type: "range",
        min: 0,
        max: 15000,
        step: 50,
        format: "currency",
      },
      {
        id: "statePensionDrawDate",
        label: "State Pension Start Date",
        type: "date",
      },
      {
        id: "sippPensionDrawAge",
        label: "Planned SIPP Draw Age",
        type: "range",
        min: 55,
        max: 85,
        step: 1,
      },
    ],
  },
  {
    id: "alpha",
    eyebrow: "Alpha Pension",
    title: "Alpha pension details",
    description: "Alpha scheme dates, service assumptions, and current accrued values.",
    fields: [
      {
        id: "alphaPensionAbsDate",
        label: "Alpha Annual Benefit Statement Date",
        type: "date",
      },
      {
        id: "alphaAddedPensionMonthly",
        label: "Added Alpha Pension (£ per month)",
        type: "range",
        min: 0,
        max: 1000,
        step: 25,
        format: "currency",
        valuePrefix: "/mo",
      },
      {
        id: "alphaPensionLeaveAge",
        label: "Age You Leave Alpha Pensionable Service",
        type: "range",
        min: 55,
        max: 85,
        step: 1,
      },
      {
        id: "accruedPensionAtLastAbs",
        label: "Alpha Pension Accrued at Last Statement (£ per year)",
        type: "range",
        min: 0,
        max: 50000,
        step: 250,
        format: "currency",
      },
      {
        id: "pensionableEarnings",
        label: "Current Pensionable Earnings (£ per year)",
        type: "range",
        min: 10000,
        max: 150000,
        step: 500,
        format: "currency",
      },
      {
        id: "alphaPensionDrawAge",
        label: "Planned Alpha Pension Draw Age",
        type: "range",
        min: 55,
        max: 85,
        step: 1,
      },
    ],
  },
] as const;

type SettingsKey = keyof PensionSettings;

function App() {
  const [settings, setSettings] = useState<PensionSettings>(loadStoredSettings);
  const projectionRows = createProjectionTable(settings);
  const latestProjectionRow = projectionRows.at(-1);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  function updateSetting<K extends SettingsKey>(key: K, value: PensionSettings[K]) {
    setSettings((current) => ({
      ...current,
      [key]: normalizeSetting(key, value),
    }));
  }

  function resetSettings() {
    setSettings(createDefaultSettings());
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Civil Service Alpha</p>
          <h1>Saved pension settings</h1>
          <p className="lead">
            Capture the baseline profile once, keep it on this device, and use it
            as the starting point for future calculator journeys.
          </p>
        </div>

        <div className="hero-actions">
          <article className="summary-card summary-card--accent">
            <p className="card-label">Storage</p>
            <h2>Saved in your browser</h2>
            <p>
              Changes are written to local storage automatically, so the same
              device comes back with the latest settings already filled in.
            </p>
          </article>

          <article className="summary-card">
            <p className="card-label">Latest gross monthly pension</p>
            <h2>{formatCurrencyDetailed(latestProjectionRow?.totalMonthlyPensionTakeHomePay ?? 0)}</h2>
            <p>
              Final row reaches age {latestProjectionRow?.age ?? settings.lifeExpectancy} on{" "}
              {formatDate(latestProjectionRow?.date ?? settings.startDate)}.
            </p>
          </article>
        </div>
      </section>

      <section className="layout">
        <section className="panel settings-panel">
          <div className="panel-heading">
            <p className="eyebrow">Settings</p>
            <h2>Pension assumptions</h2>
            <p className="section-copy">
              Everything is saved in one place, with the fields grouped by topic
              so they still read like separate sections.
            </p>
          </div>

          <div className="settings-sections">
            {fieldGroups.map((group) => (
              <section className="settings-section" key={group.id}>
                <div className="section-heading">
                  <p className="eyebrow">{group.eyebrow}</p>
                  <h3>{group.title}</h3>
                  <p className="section-copy">{group.description}</p>
                </div>

                <div className="field-grid">
                  {group.fields.map((field) => (
                    <Field
                      key={field.id}
                      field={field}
                      value={settings[field.id]}
                      onChange={updateSetting}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <aside className="panel side-panel">
          <div className="panel-heading">
            <p className="eyebrow">Snapshot</p>
            <h2>Current assumptions</h2>
            <p className="section-copy">
              A quick read-out so it is easy to sense-check what is stored.
            </p>
          </div>

          <dl className="snapshot-list">
            <div>
              <dt>Calculation Start Date</dt>
              <dd>{formatDate(settings.startDate)}</dd>
            </div>
            <div>
              <dt>Your Date of Birth</dt>
              <dd>{formatDate(settings.dateOfBirth)}</dd>
            </div>
            <div>
              <dt>State Pension Start Date</dt>
              <dd>{formatDate(settings.statePensionDrawDate)}</dd>
            </div>
            <div>
              <dt>Current Full State Pension</dt>
              <dd>{formatCurrency(settings.currentStatePension)}</dd>
            </div>
            <div>
              <dt>Current Pensionable Earnings</dt>
              <dd>{formatCurrency(settings.pensionableEarnings)}</dd>
            </div>
          </dl>

          <button className="secondary-button" onClick={resetSettings} type="button">
            Reset to defaults
          </button>
        </aside>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Projection</p>
          <h2>Monthly pension projection table</h2>
          <p className="section-copy">
            The table is generated from the projection layer so each row stays
            traceable back to the calculator inputs and factor tables.
          </p>
        </div>

        <ProjectionTable rows={projectionRows} />
      </section>
    </main>
  );
}

type FieldProps = {
  field: FieldDefinition;
  value: PensionSettings[SettingsKey];
  onChange: <K extends SettingsKey>(key: K, value: PensionSettings[K]) => void;
};

function Field({ field, value, onChange }: FieldProps) {
  if (field.type === "date") {
    return (
      <label className="field-card">
        <span className="field-header">
          <span className="field-label">{field.label}</span>
          <span className="field-value">{formatDate(value as string)}</span>
        </span>
        <input
          aria-label={field.label}
          className="date-input"
          type="date"
          value={value as string}
          onChange={(event) =>
            onChange(field.id, event.target.value as PensionSettings[typeof field.id])
          }
        />
      </label>
    );
  }

  return (
    <label className="field-card">
      <span className="field-header">
        <span className="field-label">{field.label}</span>
        <span className="field-value">
          {formatFieldValue(value as number, field.format)}
          {field.valuePrefix ?? ""}
        </span>
      </span>
      <input
        aria-label={field.label}
        className="range-input"
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        value={value as number}
        onChange={(event) =>
          onChange(field.id, Number(event.target.value) as PensionSettings[typeof field.id])
        }
      />
      <div className="range-scale">
        <span>{formatFieldValue(field.min, field.format)}</span>
        <span>{formatFieldValue(field.max, field.format)}</span>
      </div>
    </label>
  );
}

function formatFieldValue(value: number, format?: "currency") {
  if (format === "currency") {
    return formatCurrency(value);
  }

  return value.toString();
}

type ProjectionTableProps = {
  rows: ProjectionRow[];
};

function ProjectionTable({ rows }: ProjectionTableProps) {
  return (
    <div className="table-shell">
      <table className="projection-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Age</th>
            <th scope="col">Monthly Added Pension</th>
            <th scope="col">Lump sum added pension</th>
            <th scope="col">Annual Accrued Alpha Pension</th>
            <th scope="col">Annual Alpha Pension Including Reduction</th>
            <th scope="col">Monthly Alpha Pension Take-Home</th>
            <th scope="col">Monthly State pension</th>
            <th scope="col">Total Monthly Pension Take home pay</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.date}
              className={row.milestones.length > 0 ? "projection-row projection-row--milestone" : "projection-row"}
              title={row.milestones.length > 0 ? row.milestones.join(", ") : undefined}
            >
              <td>
                <div className="projection-date-cell">
                  <span>{formatDate(row.date)}</span>
                  {row.milestones.length > 0 ? (
                    <span className="milestone-badges">
                      {row.milestones.map((milestone) => (
                        <span className="milestone-badge" key={`${row.date}-${milestone}`}>
                          {milestone}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </div>
              </td>
              <td>{row.age}</td>
              <td>{formatCurrencyDetailed(row.monthlyAddedPension)}</td>
              <td>{formatCurrencyDetailed(row.lumpSumAddedPension)}</td>
              <td>{formatCurrencyDetailed(row.annualAccruedAlphaPension)}</td>
              <td>{formatCurrencyDetailed(row.annualAlphaPensionIncludingReduction)}</td>
              <td>{formatCurrencyDetailed(row.monthlyAlphaPensionTakeHome)}</td>
              <td>{formatCurrencyDetailed(row.monthlyStatePension)}</td>
              <td>{formatCurrencyDetailed(row.totalMonthlyPensionTakeHomePay)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(value: string) {
  if (!value) {
    return "Not set";
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatCurrencyDetailed(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default App;
