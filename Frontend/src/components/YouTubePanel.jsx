import { useEffect, useState } from 'react';
import {
  YOUTUBE_CHANNEL_URL,
  YOUTUBE_OEMBED_URL,
} from '../links.js';

export default function YouTubePanel() {
  const [youtubePreview, setYoutubePreview] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      try {
        const youtubeRes = await fetch(YOUTUBE_OEMBED_URL);
        if (cancelled) return;
        if (youtubeRes.ok) setYoutubePreview(await youtubeRes.json());
      } catch (error) {
        if (!cancelled) setLoadError(error);
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, []);

  let youtubeMedia = null;
  if (youtubePreview?.html) {
    youtubeMedia = (
      <div
        className="videoEmbed"
        // YouTube oEmbed returns iframe HTML.
        dangerouslySetInnerHTML={{ __html: youtubePreview.html }}
      />
    );
  } else if (youtubePreview?.thumbnail_url) {
    youtubeMedia = (
      <img
        className="thumbnail"
        src={youtubePreview.thumbnail_url}
        alt="YouTube thumbnail"
      />
    );
  }

  return (
    <section className="panel" aria-label="YouTube preview">
      <h2>
        <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noreferrer">
          YouTube
        </a>
      </h2>

      {youtubePreview ? (
        <div className="panelBody panelBodyColumn">
          {youtubeMedia}
        </div>
      ) : (
        <div className="panelText">Loading…</div>
      )}

      {loadError ? (
        <div className="panelText" role="status">
          YouTube preview failed to load.
        </div>
      ) : null}
    </section>
  );
}
