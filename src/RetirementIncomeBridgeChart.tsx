import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import * as d3 from "d3";

export type RetirementIncomePoint = {
  date: string;
  age: number;
  targetIncomeAnnual: number;
  isaIncomeAnnual: number;
  sippIncomeAnnual: number;
  alphaIncomeAnnual: number;
  statePensionIncomeAnnual: number;
  totalIncomeAnnual: number;
  shortfallAnnual: number;
  isaBalance?: number;
  sippBalance?: number;
  phase:
    | "build-up"
    | "isa-bridge"
    | "sipp-bridge"
    | "alpha-only"
    | "alpha-sipp"
    | "alpha-state";
};

export type RetirementIncomeBridgeParameters = {
  targetIncomeAnnual: number;
  alphaMonthlyAddedPension: number;
  isaMonthlyContribution: number;
  sippMonthlyContribution: number;
  retirementAge: number;
  alphaLeaveAge: number;
  sippAccessAge: number;
  alphaStartAge: number;
  statePensionAge: number;
  showIsa: boolean;
  showSipp: boolean;
  showStatePension: boolean;
};

export type RetirementIncomeBridgeChartProps = RetirementIncomeBridgeParameters & {
  data: RetirementIncomePoint[];
  alphaLabel?: string;
  limits: RetirementIncomeBridgeLimits;
  statePensionEditable?: boolean;
  onChangeParameters: (patch: Partial<RetirementIncomeBridgeParameters>) => void;
};

export type RetirementIncomeBridgeLimits = {
  targetIncomeAnnual: NumberLimit;
  alphaMonthlyAddedPension: NumberLimit;
  isaMonthlyContribution: NumberLimit;
  sippMonthlyContribution: NumberLimit;
  retirementAge: NumberLimit;
  alphaLeaveAge: NumberLimit;
  sippAccessAge: NumberLimit;
  alphaStartAge: NumberLimit;
  statePensionAge: NumberLimit;
};

type NumberLimit = {
  min: number;
  max: number;
  step: number;
};

type IncomeKey =
  | "isaIncomeAnnual"
  | "sippIncomeAnnual"
  | "alphaIncomeAnnual"
  | "statePensionIncomeAnnual";

type MilestoneKey =
  | "retirementAge"
  | "alphaLeaveAge"
  | "sippAccessAge"
  | "alphaStartAge"
  | "statePensionAge";

type MilestoneMarker = {
  key: MilestoneKey;
  label: string;
  age: number;
  colour: string;
  editable: boolean;
};

const incomeKeys: IncomeKey[] = [
  "isaIncomeAnnual",
  "sippIncomeAnnual",
  "alphaIncomeAnnual",
  "statePensionIncomeAnnual",
];

const sourceMeta: Record<IncomeKey, { label: string; shortLabel: string; colour: string }> = {
  isaIncomeAnnual: {
    label: "ISA bridge",
    shortLabel: "ISA",
    colour: "#1f8ee6",
  },
  sippIncomeAnnual: {
    label: "SIPP bridge",
    shortLabel: "SIPP",
    colour: "#148c55",
  },
  alphaIncomeAnnual: {
    label: "Alpha pension",
    shortLabel: "Alpha",
    colour: "#7353bf",
  },
  statePensionIncomeAnnual: {
    label: "State Pension",
    shortLabel: "State",
    colour: "#1d62d1",
  },
};

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  notation: "compact",
  maximumFractionDigits: 1,
});

const BUILD_UP_META = {
  label: "Build-up",
};
const HANDLE_RADIUS = 9;
const HANDLE_STACK_SPACING = 18;
const MARKER_LABEL_OFFSET = 12;
const MARKER_LABEL_SPACING = 14;

export function RetirementIncomeBridgeChart({
  data,
  targetIncomeAnnual,
  alphaMonthlyAddedPension,
  isaMonthlyContribution,
  sippMonthlyContribution,
  retirementAge,
  alphaLeaveAge,
  sippAccessAge,
  alphaStartAge,
  statePensionAge,
  showIsa,
  showSipp,
  showStatePension,
  alphaLabel = "Alpha pension",
  limits,
  statePensionEditable = false,
  onChangeParameters,
}: RetirementIncomeBridgeChartProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const markerRefs = useRef(new Map<MilestoneKey, SVGGElement>());
  const [width, setWidth] = useState(960);
  const [displayMode, setDisplayMode] = useState<"annual" | "monthly">("annual");
  const [draftMarkerAges, setDraftMarkerAges] = useState<
    Partial<Record<MilestoneKey, { age: number; baseAge: number }>>
  >({});
  const divisor = displayMode === "monthly" ? 12 : 1;
  const valueLabel = displayMode === "monthly" ? "Monthly income" : "Annual income";
  const chartTitleId = "retirement-income-bridge-chart-title";
  const chartDescriptionId = "retirement-income-bridge-chart-description";
  const visibleIncomeKeys = useMemo(
    () =>
      incomeKeys.filter((key) => {
        if (key === "isaIncomeAnnual") {
          return showIsa;
        }

        if (key === "sippIncomeAnnual") {
          return showSipp;
        }

        if (key === "statePensionIncomeAnnual") {
          return showStatePension;
        }

        return true;
      }),
    [showIsa, showSipp, showStatePension],
  );

  useEffect(() => {
    if (!shellRef.current || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setWidth(Math.max(360, entry.contentRect.width));
      }
    });

    observer.observe(shellRef.current);

    return () => observer.disconnect();
  }, []);

  const dimensions = useMemo(() => {
    const isCompact = width < 640;
    const height = isCompact ? 420 : 460;

    return {
      width,
      height,
      marginTop: isCompact ? 38 : 46,
      marginRight: isCompact ? 22 : 28,
      marginBottom: isCompact ? 34 : 38,
      marginLeft: isCompact ? 58 : 78,
    };
  }, [width]);

  const plotWidth = Math.max(
    1,
    dimensions.width - dimensions.marginLeft - dimensions.marginRight,
  );
  const plotHeight = Math.max(
    1,
    dimensions.height - dimensions.marginTop - dimensions.marginBottom,
  );
  const ageExtent = d3.extent(data, (point) => point.age);
  const minAge = Math.floor(ageExtent[0] ?? retirementAge - 5);
  const maxAge = Math.ceil(ageExtent[1] ?? statePensionAge + 20);
  const maxIncome =
    d3.max(data, (point) =>
      Math.max(point.targetIncomeAnnual, point.totalIncomeAnnual) / divisor,
    ) ?? targetIncomeAnnual / divisor;
  const yMax = Math.max((targetIncomeAnnual / divisor) * 1.18, maxIncome * 1.18, 10000 / divisor);
  const xScale = useMemo(
    () => d3.scaleLinear().domain([minAge, maxAge]).range([0, plotWidth]),
    [maxAge, minAge, plotWidth],
  );
  const yScale = useMemo(
    () => d3.scaleLinear().domain([0, yMax]).nice().range([plotHeight, 0]),
    [plotHeight, yMax],
  );
  const stack = d3
    .stack<RetirementIncomePoint>()
    .keys(visibleIncomeKeys)
    .value((point, key) => Number(point[key as IncomeKey]) / divisor);
  const stackedSeries = stack(data);
  const area = d3
    .area<d3.SeriesPoint<RetirementIncomePoint>>()
    .x((point) => xScale(point.data.age))
    .y0((point) => yScale(point[0]))
    .y1((point) => yScale(point[1]))
    .curve(d3.curveStepAfter);
  const shortfallArea = d3
    .area<RetirementIncomePoint>()
    .defined((point) => point.shortfallAnnual > 0)
    .x((point) => xScale(point.age))
    .y0((point) => yScale(point.totalIncomeAnnual / divisor))
    .y1((point) => yScale(point.targetIncomeAnnual / divisor))
    .curve(d3.curveStepAfter);
  const targetLine = d3
    .line<RetirementIncomePoint>()
    .defined((point) => point.targetIncomeAnnual > 0)
    .x((point) => xScale(point.age))
    .y((point) => yScale(point.targetIncomeAnnual / divisor))
    .curve(d3.curveStepAfter);
  const yTicks = yScale.ticks(5);
  const xTicks = xScale.ticks(width < 640 ? 5 : 8);
  const milestoneMarkers: MilestoneMarker[] = useMemo(
    () =>
      [
      {
        key: "retirementAge",
        label: "Requirement",
        age: retirementAge,
        colour: "#0f6f72",
        editable: true,
      },
      {
        key: "alphaLeaveAge",
        label: "Leave Alpha",
        age: alphaLeaveAge,
        colour: "#b45309",
        editable: true,
      },
      ...(showSipp
        ? [
            {
              key: "sippAccessAge" as const,
              label: "SIPP access",
              age: sippAccessAge,
              colour: "#148c55",
              editable: true,
            },
          ]
        : []),
      {
        key: "alphaStartAge",
        label: "Alpha starts",
        age: alphaStartAge,
        colour: "#7353bf",
        editable: true,
      },
      ...(showStatePension
        ? [
            {
              key: "statePensionAge" as const,
              label: "State Pension",
              age: statePensionAge,
              colour: "#1d62d1",
              editable: statePensionEditable,
            },
          ]
        : []),
    ],
    [
      alphaStartAge,
      alphaLeaveAge,
      retirementAge,
      showSipp,
      showStatePension,
      sippAccessAge,
      statePensionAge,
      statePensionEditable,
    ],
  );
  const displayedMilestoneMarkers = useMemo(
    () =>
      milestoneMarkers.map((marker) => ({
        ...marker,
        age: getDisplayMarkerAge(marker.age, draftMarkerAges[marker.key]),
      })),
    [draftMarkerAges, milestoneMarkers],
  );
  const markerLayouts = createMarkerLayouts(
    displayedMilestoneMarkers,
    xScale,
    plotWidth,
  );
  const buildUpWidth = Math.max(0, xScale(retirementAge) - xScale(minAge));

  useEffect(() => {
    const cleanup: Array<() => void> = [];

    milestoneMarkers.forEach((marker) => {
      const node = markerRefs.current.get(marker.key);

      if (!node || !marker.editable) {
        return;
      }

      const drag = d3
        .drag<SVGGElement, unknown>()
        .on("start drag", (event) => {
          const nextAge = xScale.invert(clampNumber(event.x, 0, plotWidth));

          setDraftMarkerAges((current) => ({
            ...current,
            [marker.key]: {
              age: snapToLimit(nextAge, limits[marker.key]),
              baseAge: marker.age,
            },
          }));
        })
        .on("end", (event) => {
          const nextAge = xScale.invert(clampNumber(event.x, 0, plotWidth));
          const committedAge = snapToLimit(nextAge, limits[marker.key]);

          setDraftMarkerAges((current) => ({
            ...current,
            [marker.key]: {
              age: committedAge,
              baseAge: marker.age,
            },
          }));
          onChangeParameters({ [marker.key]: committedAge });
        });

      d3.select(node).call(drag);
      cleanup.push(() => d3.select(node).on(".drag", null));
    });

    return () => {
      cleanup.forEach((clean) => clean());
    };
  }, [limits, milestoneMarkers, onChangeParameters, plotWidth, xScale]);

  const handleMarkerKeyDown = (
    event: KeyboardEvent<SVGGElement>,
    marker: MilestoneMarker,
  ) => {
    if (!marker.editable || !["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const direction = event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 1;
    onChangeParameters({
      [marker.key]: snapToLimit(
        marker.age + direction * limits[marker.key].step,
        limits[marker.key],
      ),
    });
  };

  if (data.length === 0) {
    return (
      <section className="bridge-chart-panel" aria-live="polite">
        <p className="section-copy">
          The chart will appear once the current assumptions produce a valid projection.
        </p>
      </section>
    );
  }

  return (
    <section className="bridge-chart-panel" aria-labelledby={chartTitleId}>
      <div className="bridge-chart-heading">
        <h3 id={chartTitleId} className="bridge-chart-title">
          Retirement income bridge
        </h3>
        <button
          type="button"
          className="secondary-button bridge-mode-button"
          onClick={() =>
            setDisplayMode((current) => (current === "annual" ? "monthly" : "annual"))
          }
        >
          Show as {displayMode === "annual" ? "monthly" : "annual"}
        </button>
      </div>

      <div className="bridge-chart-shell" ref={shellRef}>
        <svg
          className="bridge-chart-svg"
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          role="img"
          aria-labelledby={`${chartTitleId} ${chartDescriptionId}`}
          tabIndex={0}
        >
          <desc id={chartDescriptionId}>
            Stacked income chart showing ISA, SIPP, Alpha and State Pension income
            against the target retirement income over age.
          </desc>
          <defs>
            <pattern
              id="shortfall-hatch"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="#bf2c2c" strokeWidth="2" />
            </pattern>
            {visibleIncomeKeys.map((key) => (
              <linearGradient
                key={key}
                id={`bridge-gradient-${key}`}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor={sourceMeta[key].colour} stopOpacity="0.9" />
                <stop offset="100%" stopColor={sourceMeta[key].colour} stopOpacity="0.68" />
              </linearGradient>
            ))}
          </defs>

          <g transform={`translate(${dimensions.marginLeft},${dimensions.marginTop})`}>
            {buildUpWidth > 0 ? (
              <rect
                x={xScale(minAge)}
                y={0}
                width={buildUpWidth}
                height={plotHeight}
                className="bridge-build-up-band"
              />
            ) : null}

            {yTicks.map((tick) => (
              <g key={tick} className="bridge-gridline">
                <line x1={0} x2={plotWidth} y1={yScale(tick)} y2={yScale(tick)} />
                <text x={-12} y={yScale(tick)} dy="0.32em" textAnchor="end">
                  {formatCompactCurrency(tick)}
                </text>
              </g>
            ))}

            {stackedSeries.map((series) => {
              const key = series.key as IncomeKey;

              return (
                <path
                  key={key}
                  d={area(series) ?? undefined}
                  fill={`url(#bridge-gradient-${key})`}
                  stroke={sourceMeta[key].colour}
                  strokeWidth="1.5"
                />
              );
            })}

            <path
              d={shortfallArea(data) ?? undefined}
              className="bridge-shortfall-fill"
            />
            <path
              d={shortfallArea(data) ?? undefined}
              fill="url(#shortfall-hatch)"
              opacity="0.55"
            />

            <path
              className="bridge-target-line"
              d={targetLine(data) ?? undefined}
            />

            {markerLayouts.map((marker) => {
              const x = xScale(marker.age);

              return (
                <g
                  key={marker.key}
                  ref={(node) => {
                    if (node) {
                      markerRefs.current.set(marker.key, node);
                    } else {
                      markerRefs.current.delete(marker.key);
                    }
                  }}
                  className={
                    marker.editable
                      ? "bridge-milestone bridge-milestone--editable"
                      : "bridge-milestone"
                  }
                  role={marker.editable ? "slider" : "img"}
                  tabIndex={0}
                  aria-label={`${marker.label}, age ${formatAgeValue(marker.age)}`}
                  aria-valuemin={limits[marker.key].min}
                  aria-valuemax={limits[marker.key].max}
                  aria-valuenow={marker.age}
                  onKeyDown={(event) => handleMarkerKeyDown(event, marker)}
                >
                  <line
                    x1={x}
                    x2={x}
                    y1={marker.handleY}
                    y2={plotHeight}
                    stroke={marker.colour}
                  />
                  <text
                    x={x + marker.labelOffsetX}
                    y={marker.labelY}
                    className="bridge-milestone-label"
                    fill={marker.colour}
                  >
                    {`${marker.label} ${formatAgeValue(marker.age)}`}
                  </text>
                  <circle cx={x} cy={marker.handleY} r={HANDLE_RADIUS} fill={marker.colour} />
                  <text
                    x={x}
                    y={marker.handleY + 4}
                    textAnchor="middle"
                    className="bridge-handle-icon"
                  >
                    ↔
                  </text>
                </g>
              );
            })}

            <line className="bridge-axis" x1={0} x2={plotWidth} y1={plotHeight} y2={plotHeight} />
            <line className="bridge-axis" x1={0} x2={0} y1={0} y2={plotHeight} />
            {xTicks.map((tick) => (
              <g key={tick} className="bridge-x-tick">
                <line x1={xScale(tick)} x2={xScale(tick)} y1={plotHeight} y2={plotHeight + 6} />
                <text x={xScale(tick)} y={plotHeight + 18} textAnchor="middle">
                  {Math.round(tick)}
                </text>
              </g>
            ))}
            <text className="bridge-axis-title" x={0} y={plotHeight + 30}>
              Age
            </text>
            <text
              className="bridge-axis-title"
              x={-dimensions.marginLeft + 2}
              y={-24}
            >
              {valueLabel} (£)
            </text>
          </g>
        </svg>

        <div className="bridge-legend bridge-legend--overlay" aria-label="Income sources">
          <span>
            <span className="bridge-build-up-key" />
            {BUILD_UP_META.label}
          </span>
          {visibleIncomeKeys.map((key) => (
            <span key={key}>
              <span style={{ background: sourceMeta[key].colour }} />
              {key === "alphaIncomeAnnual" ? alphaLabel : sourceMeta[key].label}
            </span>
          ))}
          <span>
            <span className="bridge-shortfall-key" />
            Shortfall
          </span>
        </div>

      </div>

      <div className="bridge-source-controls" aria-label="Chart income sources">
        <BridgeSourceToggle
          label="ISA"
          ariaLabel="Toggle chart individual savings account source"
          checked={showIsa}
          colour={sourceMeta.isaIncomeAnnual.colour}
          onChange={(checked) => onChangeParameters({ showIsa: checked })}
        />
        <BridgeSourceToggle
          label="SIPP"
          ariaLabel="Toggle chart personal pension source"
          checked={showSipp}
          colour={sourceMeta.sippIncomeAnnual.colour}
          onChange={(checked) => onChangeParameters({ showSipp: checked })}
        />
        <BridgeSourceToggle
          label="State Pension"
          ariaLabel="Toggle chart state pension source"
          checked={showStatePension}
          colour={sourceMeta.statePensionIncomeAnnual.colour}
          onChange={(checked) => onChangeParameters({ showStatePension: checked })}
        />
      </div>

      <div className="bridge-control-grid">
        <BridgeMetricControl
          label="Added Alpha pension"
          value={alphaMonthlyAddedPension}
          suffix="/ month"
          limit={limits.alphaMonthlyAddedPension}
          colour="#7353bf"
          onChange={(value) => onChangeParameters({ alphaMonthlyAddedPension: value })}
        />
        {showIsa ? (
          <BridgeMetricControl
            label="ISA contribution"
            value={isaMonthlyContribution}
            suffix="/ month"
            limit={limits.isaMonthlyContribution}
            colour="#1f8ee6"
            onChange={(value) => onChangeParameters({ isaMonthlyContribution: value })}
          />
        ) : null}
        {showSipp ? (
          <BridgeMetricControl
            label="SIPP contribution"
            value={sippMonthlyContribution}
            suffix="/ month"
            limit={limits.sippMonthlyContribution}
            colour="#148c55"
            onChange={(value) => onChangeParameters({ sippMonthlyContribution: value })}
          />
        ) : null}
        <BridgeMetricControl
          label="Target income"
          value={targetIncomeAnnual / 12}
          suffix="/ month"
          limit={{
            min: limits.targetIncomeAnnual.min / 12,
            max: limits.targetIncomeAnnual.max / 12,
            step: limits.targetIncomeAnnual.step / 12,
          }}
          colour="#0b3c5d"
          onChange={(value) => onChangeParameters({ targetIncomeAnnual: value * 12 })}
        />
      </div>
    </section>
  );
}

function BridgeSourceToggle({
  label,
  ariaLabel,
  checked,
  colour,
  onChange,
}: {
  label: string;
  ariaLabel: string;
  checked: boolean;
  colour: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="bridge-source-toggle"
      aria-label={ariaLabel}
      aria-pressed={checked}
      style={{ "--control-colour": colour } as React.CSSProperties}
      onClick={() => onChange(!checked)}
    >
      <span />
      {label}
    </button>
  );
}

function BridgeMetricControl({
  label,
  value,
  suffix,
  limit,
  colour,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  limit: NumberLimit;
  colour: string;
  onChange: (value: number) => void;
}) {
  const boundedValue = clampToLimit(value, limit);
  const roundedValue = Math.round(boundedValue);

  return (
    <div className="bridge-control-card" style={{ "--control-colour": colour } as React.CSSProperties}>
      <span>{label}</span>
      <strong>
        {formatCurrency(roundedValue)} <small>{suffix}</small>
      </strong>
      <div className="bridge-control-row">
        <button
          type="button"
          onClick={() => onChange(clampToLimit(roundedValue - limit.step, limit))}
        >
          −
        </button>
        <input
          aria-label={label}
          type="range"
          min={limit.min}
          max={limit.max}
          step={limit.step}
          value={boundedValue}
          onChange={(event) => onChange(clampToLimit(Number(event.target.value), limit))}
        />
        <button
          type="button"
          onClick={() => onChange(clampToLimit(roundedValue + limit.step, limit))}
        >
          +
        </button>
      </div>
    </div>
  );
}

function createMarkerLayouts(
  markers: MilestoneMarker[],
  xScale: d3.ScaleLinear<number, number>,
  plotWidth: number,
) {
  const rowEnds: number[] = [];
  const rowByKey = new Map<MilestoneKey, number>();

  [...markers]
    .sort((first, second) => xScale(first.age) - xScale(second.age))
    .forEach((marker) => {
      const markerX = xScale(marker.age);
      const row = rowEnds.findIndex((endX) => markerX - endX >= MARKER_LABEL_SPACING);
      const nextRow = row === -1 ? rowEnds.length : row;
      rowEnds[nextRow] = markerX;
      rowByKey.set(marker.key, nextRow);
    });

  return markers.map((marker) => {
    const row = rowByKey.get(marker.key) ?? 0;
    const markerX = xScale(marker.age);
    const baseOffset = MARKER_LABEL_OFFSET + row * MARKER_LABEL_SPACING;
    const labelOffsetX = markerX > plotWidth - 36 ? -baseOffset : baseOffset;
    const handleY = row * HANDLE_STACK_SPACING;
    const labelY = Math.max(10, handleY + 10);

    return {
      ...marker,
      handleY,
      labelOffsetX,
      labelY,
    };
  });
}

function formatCurrency(value: number) {
  return currencyFormatter.format(Math.round(value));
}

function formatCompactCurrency(value: number) {
  return compactCurrencyFormatter.format(value);
}

function formatAgeValue(value: number) {
  return value.toFixed(2).replace(/\.00$/, "");
}

function getDisplayMarkerAge(
  sourceAge: number,
  draftAge: { age: number; baseAge: number } | undefined,
) {
  if (!draftAge) {
    return sourceAge;
  }

  if (
    areAgesEquivalent(sourceAge, draftAge.baseAge) ||
    areAgesEquivalent(sourceAge, draftAge.age)
  ) {
    return draftAge.age;
  }

  return sourceAge;
}

function areAgesEquivalent(firstAge: number, secondAge: number) {
  return Math.abs(firstAge - secondAge) < 0.001;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampToLimit(value: number, limit: NumberLimit) {
  return clampNumber(value, limit.min, limit.max);
}

function snapToLimit(value: number, limit: NumberLimit) {
  const clamped = clampToLimit(value, limit);
  const steps = Math.round((clamped - limit.min) / limit.step);
  const snapped = limit.min + steps * limit.step;
  return Number(snapToLimitPrecision(snapped, limit.step));
}

function snapToLimitPrecision(value: number, step: number) {
  const precision = Math.max(0, (step.toString().split(".")[1] ?? "").length);
  return value.toFixed(precision);
}
