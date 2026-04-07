import { useEffect } from 'react';
import GitHubPanel from './components/GitHubPanel.jsx';
import LinkedInPanel from './components/LinkedInPanel.jsx';
import YouTubePanel from './components/YouTubePanel.jsx';

function App() {
  useEffect(() => {
    async function countVisit() {
      try {
        const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL ?? '').trim();
        const url = apiBaseUrl ? new URL('/api/visits', apiBaseUrl).toString() : '/api/visits';
        const credentials = apiBaseUrl ? 'include' : 'same-origin';

        const res = await fetch(url, { method: 'POST', credentials });
        if (!res.ok) return;
        await res.json();
      } catch {
        // ignore; counter is best-effort
      }
    }

    countVisit();
  }, []);

  return (
    <div className="App">
      <div
        className="background"
        style={{ backgroundImage: "url('/Images/forest.png')" }}
      >
        <div className="content">
          <h1>Welcome to my web page</h1>
          <p>This page contains links to my other pages and also displays content from said pages.</p>
        </div>
        <div className="panels" role="region" aria-label="Link previews">
          <GitHubPanel />
          <YouTubePanel />
          <LinkedInPanel />
        </div>
      </div>
    </div>
  );
}

export default App;