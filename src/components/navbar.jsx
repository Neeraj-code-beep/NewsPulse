import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebase.config';
import { toast } from 'react-toastify';
import { LogOut, Menu, X } from 'lucide-react';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { useFavourites } from '../hooks/useFavourites';

function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, authLoading } = useFavourites();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const isLoggedIn = Boolean(user);

  async function logout() {
    try {
      await signOut(auth);
      setMenuOpen(false);
      toast.success('Logged out successfully');
      navigate('/', { replace: true });
    } catch {
      toast.warn('Failed to logout');
    }
  }

  function confirmLogout() {
    confirmAlert({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        { label: 'Yes', onClick: logout },
        { label: 'No', onClick: () => {} }
      ]
    });
  }

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    localStorage.removeItem('user');
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/favourites', label: 'Favourites' },
    ...(!authLoading && !isLoggedIn
      ? [{ to: '/login', label: 'Login' }, { to: '/register', label: 'Register' }]
      : []),
    { to: '/contact', label: 'Contact' }
  ];

  const linkClass = (to, mobile = false) => {
    const active = pathname === to;
    return `${mobile ? 'block min-h-12 w-full px-4 py-3' : 'inline-flex min-h-11 items-center px-4 py-2'} rounded-xl font-medium transition-colors ${
      active
        ? 'bg-cyan-400/15 text-cyan-200'
        : 'text-zinc-300 hover:bg-white/10 hover:text-white'
    }`;
  };

  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-black via-zinc-900 to-gray-950 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex min-h-12 items-center justify-between gap-3">
          <Link to="/" className="group flex shrink-0 items-center gap-2" aria-label="NewsPulse home">
            <img
              src="https://png.pngtree.com/png-vector/20221127/ourmid/pngtree-digital-media-play-button-gradient-color-hexagon-marketing-agency-mobile-app-png-image_6482499.png"
              width={44}
              height={44}
              alt=""
              decoding="async"
              className="transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-xl font-extrabold tracking-wide text-white sm:text-2xl">
              News<span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Pulse</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {links.map(({ to, label }) => (
              <Link key={to} to={to} className={linkClass(to)} aria-current={pathname === to ? 'page' : undefined}>
                {label}
              </Link>
            ))}
            {isLoggedIn && (
              <button
                type="button"
                onClick={confirmLogout}
                aria-label="Log out"
                className="ml-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut size={18} aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white md:hidden"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>

        <div
          id="mobile-navigation"
          hidden={!menuOpen}
          className="border-t border-white/10 pb-2 pt-3 md:hidden"
        >
            <div className="flex flex-col gap-1">
              {links.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={linkClass(to, true)}
                  aria-current={pathname === to ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-zinc-300 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut size={18} aria-hidden="true" /> Log out
                </button>
              )}
            </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
