import { useEffect, useMemo, useState } from 'react';
import {
  FEATURED_GITHUB_REPOS,
  GITHUB_PROFILE_API_URL,
  GITHUB_URL,
} from '../links.js';

export default function GitHubPanel() {
  const [githubProfile, setGithubProfile] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const featuredRepos = useMemo(() => {
    return FEATURED_GITHUB_REPOS.map((repoName) => ({
      name: repoName,
      url: `https://github.com/Lekematti/${repoName}`,
      description: null,
    }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const githubRes = await fetch(GITHUB_PROFILE_API_URL);

        if (cancelled) return;

        if (githubRes.ok) setGithubProfile(await githubRes.json());
      } catch (error) {
        if (!cancelled) setLoadError(error);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="panel" aria-label="GitHub preview">
      <h2>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </h2>

      {githubProfile ? (
        <div className="panelBody">
          {githubProfile.avatar_url ? (
            <img
              className="avatar"
              src={githubProfile.avatar_url}
              alt="GitHub avatar"
              width={64}
              height={64}
            />
          ) : null}
          <div>
            <div className="panelTitle">
              {githubProfile.name ?? githubProfile.login}
            </div>
            {githubProfile.bio ? (
              <div className="panelText">{githubProfile.bio}</div>
            ) : null}
            <div className="panelText">
              Repos: {githubProfile.public_repos ?? '—'} · Followers:{' '}
              {githubProfile.followers ?? '—'}
            </div>
          </div>
        </div>
      ) : (
        <div className="panelText">Loading…</div>
      )}

      <div className="pinnedRepos">
        <div className="panelTitle">My Favorites</div>
        <ul className="repoList">
          {featuredRepos.map((repo) => (
            <li key={repo.url ?? repo.name} className="repoItem">
              <a href={repo.url} target="_blank" rel="noreferrer">
                {repo.name}
              </a>
              {repo.description ? (
                <div className="panelText">{repo.description}</div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {loadError ? (
        <output className="panelText">
          GitHub preview failed to load.
        </output>
      ) : null}
    </section>
  );
}
