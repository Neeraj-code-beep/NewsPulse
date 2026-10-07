import { AlertCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getRelatedNews } from '../services/Recommendations.js';

function RelatedNewsSection({ article }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState('idle');
  const [related, setRelated] = useState([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!expanded) return undefined;
    const controller = new AbortController();
    let active = true;
    setStatus('loading');
    setRelated([]);

    getRelatedNews(article, { signal: controller.signal })
      .then((articles) => {
        if (!active) return;
        setRelated(articles);
        setStatus(articles.length ? 'success' : 'empty');
      })
      .catch((error) => {
        if (!active || error.code === 'ERR_CANCELED' || error.name === 'CanceledError') return;
        setStatus('error');
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [article, expanded, attempt]);

  return (
    <section className="mt-5 border-t border-white/10 pt-4" aria-labelledby={`related-heading-${article?.id || 'story'}`}>
      <h3 id={`related-heading-${article?.id || 'story'}`} className="sr-only">Related news</h3>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 py-2 font-semibold text-cyan-100 hover:bg-white/10"
      >
        Related News {expanded ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
      </button>

      {expanded && (
        <div className="mt-4" aria-live="polite">
          {status === 'loading' && <p role="status" className="flex items-center gap-2 text-sm text-zinc-300"><Loader2 size={16} className="animate-spin" aria-hidden="true" />Finding related stories…</p>}
          {status === 'empty' && <p role="status" className="text-sm text-zinc-300">No closely related stories found.</p>}
          {status === 'error' && (
            <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-red-200">
              <AlertCircle size={16} aria-hidden="true" /> Related stories could not be loaded.
              <button type="button" onClick={() => setAttempt((value) => value + 1)} className="min-h-11 rounded-lg px-2 font-semibold underline underline-offset-2">Try again</button>
            </div>
          )}
          {status === 'success' && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {related.map((story) => (
                <li key={story.id || story.url} className="min-w-0 rounded-xl border border-white/10 bg-black/30 p-3">
                  <a href={story.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center rounded text-sm font-semibold text-cyan-100 hover:underline focus-visible:underline">
                    {story.title}
                  </a>
                  <p className="mt-1 text-xs text-zinc-400">{story.source?.name || 'Unknown source'}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

export default RelatedNewsSection;
