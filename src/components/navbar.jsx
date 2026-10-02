import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebase.config';
import { toast } from 'react-toastify';
import { LogOut, Plus } from 'lucide-react';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

function Navbar() {
  const pathname = useLocation();
  const router = useNavigate();

  async function logout() {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      router('/', { replace: true });
    } catch (error) {
      toast.warn('Failed to logout');
    }
  }

  const active =
    'bg-blue-700 text-white hover:bg-blue-600  rounded md:bg-transparent md:text-blue-700';

  const [loggedin, setLoggedIn] = useState(false);

  useEffect(() => {
    // Remove the legacy serialized Firebase user object; Firebase owns auth persistence.
    localStorage.removeItem('user');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoggedIn(Boolean(user));
    });

    return () => unsubscribe();
  }, []);
  return (
    <nav className="bg-gradient-to-r from-black via-zinc-900 to-gray-950 border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="https://png.pngtree.com/png-vector/20221127/ourmid/pngtree-digital-media-play-button-gradient-color-hexagon-marketing-agency-mobile-app-png-image_6482499.png"
              width={48}
              height={48}
              alt="logo"
              loading="lazy"
              className="group-hover:scale-110 transition-all duration-300"
            />

            <h1 className="text-2xl font-extrabold tracking-wide text-white">
              News
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Pulse
              </span>
            </h1>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-3 md:gap-6">
            <ul className="flex items-center gap-2 md:gap-5 text-sm md:text-base font-medium">
              <li>
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                    pathname.pathname === '/'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                      : 'text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  to="/about"
                  className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                    pathname.pathname === '/about'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                      : 'text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  About
                </Link>
              </li>

              {!loggedin && (
                <>
                  <li>
                    <Link
                      to="/login"
                      className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                        pathname.pathname === '/login'
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                          : 'text-zinc-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      Login
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/register"
                      className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                        pathname.pathname === '/register'
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                          : 'text-zinc-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      Register
                    </Link>
                  </li>
                </>
              )}

              <li>
                <Link
                  to="/contact"
                  className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                    pathname.pathname === '/contact'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                      : 'text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Contact
                </Link>
              </li>

              {loggedin && (
                <li>
                  <button
                    onClick={() => {
                      confirmAlert({
                        title: 'Logout',
                        message: 'Are you sure you want to logout?',
                        buttons: [
                          {
                            label: 'Yes',
                            onClick: () => {
                              logout();
                              setLoggedIn(false);
                            },
                          },
                          {
                            label: 'No',
                            onClick: () => {},
                          },
                        ],
                      });
                    }}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                  >
                    <LogOut size={18} />
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
