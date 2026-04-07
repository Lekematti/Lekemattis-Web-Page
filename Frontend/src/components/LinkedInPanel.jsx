import { LINKEDIN_URL } from '../links.js';

export default function LinkedInPanel() {
  return (
    <section className="panel" aria-label="LinkedIn preview">
      <h2>
        <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
      </h2>
      <div className="panelText">
        LinkedIn usually blocks embedding/previews, so this opens in a new tab.
      </div>
    </section>
  );
}
