import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { auth } from '../../firebase/firebase.config';

import { toast } from 'react-toastify';

import { signInWithEmailAndPassword } from 'firebase/auth';

import { Eye, EyeOff, Mail, Lock, Newspaper, Loader2 } from 'lucide-react';

function LoginPage() {
  const [data, setData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const router = useNavigate();

  async function login() {
    if (!data.email || !data.password) {
      toast.error('Please fill all the fields');

      return;
    }

    try {
      setLoading(true);

      const user = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );

      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Logged in successfully');

      router('/');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loading) return;

    if (auth.currentUser || localStorage.getItem('user')) {
      router('/');
    }
  }, [loading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl">
        {/* Left Side */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop"
            alt="news"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-black/70"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
              <Newspaper size={18} className="text-cyan-300" />

              <span className="text-sm text-zinc-200 tracking-wide">
                NewsPulse Platform
              </span>
            </div>
          </div>

          <div className="relative z-10">
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
              Stay Updated
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Every Minute
              </span>
            </h1>

            <p className="text-zinc-300 text-lg leading-relaxed max-w-md">
              Access trending headlines, breaking stories, and personalized news
              from around the world.
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="p-8 md:p-14 flex flex-col justify-center">
          {/* Logo */}
          <div className="flex items-center gap-3 justify-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Newspaper className="text-white" />
            </div>

            <h2 className="text-3xl font-extrabold text-white">
              News
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Pulse
              </span>
            </h2>
          </div>

          {/* Heading */}
          <div className="text-center mb-10">
            <h3 className="text-4xl font-bold text-white mb-3">Welcome Back</h3>

            <p className="text-zinc-400">
              Login to continue exploring the latest news.
            </p>
          </div>

          {/* Email */}
          <div className="mb-6">
            <label className="text-sm text-zinc-300 mb-3 block font-medium">
              Email Address
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                value={data.email}
                onChange={(e) =>
                  setData({
                    ...data,
                    email: e.target.value,
                  })
                }
                type="email"
                placeholder="Enter your email"
                className="w-full bg-white/5 border border-white/10 focus:border-cyan-400 outline-none rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-500 transition-all duration-300"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-8">
            <label className="text-sm text-zinc-300 mb-3 block font-medium">
              Password
            </label>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                value={data.password}
                onChange={(e) =>
                  setData({
                    ...data,
                    password: e.target.value,
                  })
                }
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="w-full bg-white/5 border border-white/10 focus:border-cyan-400 outline-none rounded-2xl py-4 pl-12 pr-14 text-white placeholder:text-zinc-500 transition-all duration-300"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-cyan-300 transition-all duration-300"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            disabled={loading}
            onClick={() => {
              login();
            }}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:scale-[1.02] transition-all duration-300 py-4 rounded-2xl text-white font-semibold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Logging In...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Register */}
          <div className="mt-8 text-center">
            <p className="text-zinc-400">
              Don’t have an account?{' '}
              <Link
                to="/register"
                className="text-cyan-300 hover:text-cyan-200 font-semibold transition-all duration-300"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
