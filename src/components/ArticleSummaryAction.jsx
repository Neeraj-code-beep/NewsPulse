import { Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useFavourites } from '../hooks/useFavourites';
import API from '../services/NewsApi.jsx';

function ArticleSummaryAction({ article }) {
  const { user, authLoading } = useFavourites();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [summary, setSummary] = useState('');
  const hasArticleText = Boolean(
    typeof article?.title === 'string' && article.title.trim()
    && ((typeof article?.description === 'string' && article.description.trim())
      || (typeof article?.content === 'string' && article.content.trim()))
  );

  async function generateSummary() {
    if (!user) {
      toast.warning('Please sign in to summarize articles.');
      navigate('/login');
      return;
    }
    if (!hasArticleText || status === 'loading') return;

    setStatus('loading');
    setSummary('');
    const payload = {
      title: article.title,
      ...(typeof article.description === 'string' ? { description: article.description } : {}),
      ...(typeof article.content === 'string' ? { content: article.content } : {}),
      ...(typeof article.url === 'string' && article.url.trim() ? { url: article.url } : {})
    };

    try {
      const response = await API.post('/ai/summarize', payload);
      const result = response.data?.data?.summary;
      if (typeof result !== 'string' || !result.trim()) throw new Error('Summary unavailable');
      setSummary(result.trim());
      setStatus('success');
    } catch (error) {
      const code = error.response?.data?.error?.code;
      if (error.response?.status === 401 || code === 'AUTH_REQUIRED' || code === 'AUTH_INVALID_TOKEN') {
        setStatus('auth');
      } else if (error.response?.status === 429 || code === 'AI_RATE_LIMITED') {
        setStatus('rate-limited');
      } else if (error.response?.status === 503 || code === 'AI_PROVIDER_ERROR' || code === 'AI_CONFIGURATION_ERROR') {
        setStatus('unavailable');
      } else {
        setStatus('error');
      }
    }
  }

  const summaryMessage = {
    auth: 'Sign in to generate a summary.',
    'rate-limited': 'You have reached the summary request limit. Please try again later.',
    unavailable: 'Summaries are temporarily unavailable. Please try again later.',
    error: 'We could not generate a summary. Please try again.'
  }[status];

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={generateSummary}
        disabled={authLoading || status === 'loading' || !hasArticleText}
        aria-busy={status === 'loading'}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'loading' ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
        {status === 'loading' ? 'Summarizing…' : status === 'success' ? 'Summarized' : 'Summarize'}
      </button>

      {status === 'loading' && <p className="mt-3 text-sm text-cyan-100" role="status" aria-live="polite">Generating a concise article summary…</p>}
      {status === 'success' && (
        <section className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-950/30 p-4 sm:p-5" aria-label="Article summary" aria-live="polite">
          <h3 className="mb-2 font-semibold text-cyan-100">Article summary</h3>
          <p className="whitespace-pre-line leading-relaxed text-zinc-100">{summary}</p>
        </section>
      )}
      {summaryMessage && (
        <div className="mt-3 text-sm text-red-200" role="alert">
          <p>{summaryMessage}</p>
          {status === 'auth' && <Link className="mt-1 inline-flex min-h-10 items-center underline underline-offset-2" to="/login">Go to sign in</Link>}
          {(status === 'error' || status === 'unavailable') && (
            <button type="button" onClick={generateSummary} className="ml-2 min-h-10 rounded-lg px-2 font-semibold underline underline-offset-2">Retry</button>
          )}
        </div>
      )}
      {!hasArticleText && <p className="mt-2 text-sm text-zinc-400">This article does not contain enough text to summarize.</p>}
    </div>
  );
}

export default ArticleSummaryAction;
