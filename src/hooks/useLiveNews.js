import { useCallback, useEffect, useRef, useState } from 'react';
import { deduplicateLiveArticles, getLiveArticleIdentities } from '../utils/liveNews.js';
import { getLiveNewsSocket } from '../services/socket.js';

const MAX_KNOWN_ARTICLES = 2_000;

export function useLiveNews({ enabled = true, existingArticles = [] } = {}) {
  const [connectionStatus, setConnectionStatus] = useState(enabled ? 'connecting' : 'disconnected');
  const [pendingArticles, setPendingArticles] = useState([]);
  const pendingRef = useRef([]);
  const knownArticlesRef = useRef(new Map());

  const remember = useCallback((article) => {
    const identities = getLiveArticleIdentities(article);
    if (!identities.length) return;
    const known = knownArticlesRef.current;
    for (const identity of identities) {
      if (known.has(identity)) known.delete(identity);
      known.set(identity, true);
    }
    while (known.size > MAX_KNOWN_ARTICLES) known.delete(known.keys().next().value);
  }, []);

  useEffect(() => {
    for (const article of existingArticles) remember(article);
  }, [existingArticles, remember]);

  useEffect(() => {
    if (!enabled) {
      setConnectionStatus('disconnected');
      return undefined;
    }

    const socket = getLiveNewsSocket();
    const onConnect = () => setConnectionStatus('connected');
    const onDisconnect = () => setConnectionStatus('disconnected');
    const onConnectError = () => setConnectionStatus('connecting');
    const onNewsUpdate = (payload) => {
      if (!Array.isArray(payload?.articles)) return;
      const known = knownArticlesRef.current;
      const additions = deduplicateLiveArticles(payload.articles, new Set(known.keys()));
      if (!additions.length) return;
      for (const article of additions) remember(article);
      pendingRef.current = deduplicateLiveArticles([...pendingRef.current, ...additions]);
      setPendingArticles(pendingRef.current);
    };

    setConnectionStatus(socket.connected ? 'connected' : 'connecting');
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('news:update', onNewsUpdate);
    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('news:update', onNewsUpdate);
      socket.disconnect();
      setConnectionStatus('disconnected');
    };
  }, [enabled, remember]);

  const takePendingArticles = useCallback(() => {
    const articles = pendingRef.current;
    pendingRef.current = [];
    setPendingArticles([]);
    return articles;
  }, []);

  return { connectionStatus, pendingArticles, takePendingArticles };
}
