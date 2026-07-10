import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { staticDataService } from "../services/staticDataService";

function CharitySystemPage() {
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await staticDataService.getCharityContent();
        setContent(data);
      } catch (e) {
        console.warn("Failed to load charity content:", e);
      } finally {
        setLoading(false);
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
        {loading ? <p className="text-slate-500">Loading charity information...</p> : null}

        <section className="info-hero">
          <span className="panel-tag">08 Charity system</span>
          <h1>{content?.title ?? "How the charity process works"}</h1>
          <p>{content?.description}</p>
          <div className="info-hero-actions">
            <Link className="action action-solid" to="/prize-pool">
              View prize pool rules
            </Link>
            <Link className="action action-muted" to="/">
              Back to home
            </Link>
          </div>
        </section>

        <section className="info-section">
          <div className="info-grid">
            {(content?.steps ?? []).map((step, index) => (
              <article key={step.title} className="info-card">
                <h3>
                  {index + 1}) {step.title}
                </h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        {content?.callout ? (
          <section className="info-section">
            <div className="info-callout">
              <h2>{content.callout.title}</h2>
              <p>{content.callout.description}</p>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

export default CharitySystemPage;
