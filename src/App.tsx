const pillars = [
  {
    title: "Spreadsheet logic",
    body: "We can move formulas and rules into a clean calculation layer next.",
  },
  {
    title: "Guided questions",
    body: "The UI is ready to grow into a step-by-step flow for mobile and desktop.",
  },
  {
    title: "Clear results",
    body: "Outputs can become a readable summary instead of a complex workbook.",
  },
];

function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Civil Service Alpha</p>
        <h1>Calculator foundation</h1>
        <p className="lead">
          This starter gives us a React and TypeScript base we can use to turn
          the spreadsheet into a fast, browser-based calculator.
        </p>

        <div className="hero-grid">
          <article className="summary-card summary-card--accent">
            <p className="card-label">Chosen stack</p>
            <h2>React + Vite + TypeScript</h2>
            <p>
              Lightweight to build on, quick to run locally, and a good fit for
              an alpha we expect to iterate on.
            </p>
          </article>

          <article className="summary-card">
            <p className="card-label">First milestone</p>
            <h2>Responsive shell</h2>
            <p>
              One interface, designed to scale from phone screens up to desktop
              browsers without branching into separate apps.
            </p>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Next Build Areas</p>
          <h2>What we can layer in next</h2>
        </div>

        <div className="pillars">
          {pillars.map((pillar) => (
            <article className="pillar" key={pillar.title}>
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
