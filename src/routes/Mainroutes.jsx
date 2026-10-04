import React, { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';

const HomePage = lazy(() => import('../pages/Home'));
const LoginPage = lazy(() => import('../pages/Login'));
const AboutPage = lazy(() => import('../pages/About'));
const News = lazy(() => import('../pages/News'));
const RegisterPage = lazy(() => import('../pages/register'));
const Contact = lazy(() => import('../pages/Contact'));
const FavouritesPage = lazy(() => import('../pages/Favourites'));

function RouteLoading() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[40vh] items-center justify-center px-4 text-center text-cyan-200">
      <span>Loading page…</span>
    </div>
  );
}

function NotFoundPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center text-white">
      <h1 className="text-4xl font-bold">Page not found</h1>
      <p className="text-zinc-300">We couldn’t find that NewsPulse page.</p>
      <Link to="/" className="inline-flex min-h-11 items-center rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
        Return home
      </Link>
    </main>
  );
}

const Mainroutes = () => (
  <Suspense fallback={<RouteLoading />}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/news/:newsID" element={<News />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/favourites" element={<FavouritesPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

export default Mainroutes;
