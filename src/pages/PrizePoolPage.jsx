import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { staticDataService } from "../services/staticDataService";

function PrizePoolPage() {
  const navigate = useNavigate();
  const [poolRules, setPoolRules] = useState([]);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await staticDataService.getPrizePoolRules();
        if (data.poolRules) setPoolRules(data.poolRules);
        if (data.notes) setNotes(data.notes);
      } catch (e) {
        console.warn("Failed to load prize pool rules:", e);
      }
    })();
  }, []);

  return (
    <div className="info-shell">
      <header className="home-nav info-nav">
        <strong>Impact Performance System</strong>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/charity">Charity system</Link>
          <Link to="/prize-pool">Prize pool</Link>
        </nav>
        <div className="home-nav-actions">
          <button className="action action-muted" type="button" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="action action-solid" type="button" onClick={() => navigate("/signup")}>
            Signup
          </button>
        </div>
      </header>

      <main className="info-main">
        <section className="info-hero">
          <span className="panel-tag">Prize pool</span>
          <h1>Pre-defined prize pool distribution</h1>
          <p>
            A fixed portion of each subscription contributes to the prize pool. Distribution is
            pre-defined and enforced automatically.
          </p>
          <div className="info-hero-actions">
            <Link className="action action-muted" to="/charity">
              How charity works
            </Link>
            <Link className="action action-muted" to="/">
              Back to home
            </Link>
          </div>
        </section>

        <section className="info-section">
          <div className="table-shell">
            <div className="table-head">
              <h2>Match Type → Pool Share</h2>
              <p>Rollover rules are enforced per tier.</p>
            </div>

            <div className="table-scroll">
              <table className="impact-table">
                <thead>
                  <tr>
                    <th>Match Type</th>
                    <th>Pool Share</th>
                    <th>Rollover?</th>
                  </tr>
                </thead>
                <tbody>
                  {poolRules.map((row) => (
                    <tr key={row.matchType}>
                      <td>{row.matchType}</td>
                      <td className="table-accent">{row.share}</td>
                      <td>{row.rollover}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="info-section">
          <div className="info-grid">
            {notes.map((note) => (
              <article key={note} className="info-card">
                <p>{note}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default PrizePoolPage;

