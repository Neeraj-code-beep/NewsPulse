import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../../firebase/firebase.config';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import { useFavourites } from '../hooks/useFavourites';

const regSchema = z
  .object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .refine(
        (password) => /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(password),
        {
          message: 'Password must contain uppercase, lowercase and number',
        },
      ),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

function RegisterPage() {
  const router = useNavigate();
  const { user, authLoading } = useFavourites();
  const [formError, setFormError] = React.useState('');
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(regSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function handleRegister(data) {
    try {
      const resp = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );

      const user = resp.user;

      await updateProfile(user, {
        displayName: data.name,
      });

      toast.success('Account created successfully');
      reset();
      clearErrors();

      router('/');
    } catch (error) {
      setFormError('We couldn’t create your account. Check your details and try again.');
      if (error.code === 'auth/email-already-in-use') {
        setFormError('That email address is already registered. Try signing in instead.');
      }
    }
  }

  async function sign_with_google() {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();

      const resp = await signInWithPopup(auth, provider);

      const user = resp.user;

      if (!user) {
        throw new Error('Authentication failed');
      }

      toast.success('Logged in successfully');

      router('/');
    } catch {
      toast.error('Google sign in could not be completed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user) router('/', { replace: true });
  }, [authLoading, router, user]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex w-1/2 bg-black text-white items-center justify-center p-10">
        <div className="max-w-lg">
          <h1 className="text-5xl font-bold leading-tight">
            Stay Updated With
            <span className="block text-gray-400 mt-2">Latest News</span>
          </h1>

          <p className="mt-6 text-gray-300 text-lg leading-relaxed">
            Create your free account and personalize your news experience. Save
            favourite articles and explore trending stories worldwide.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-5 rounded-2xl backdrop-blur">
              <h3 className="font-semibold text-xl">Live News</h3>
              <p className="text-sm text-gray-300 mt-2">
                Real-time breaking headlines
              </p>
            </div>

            <div className="bg-white/10 p-5 rounded-2xl backdrop-blur">
              <h3 className="font-semibold text-xl">Save Articles</h3>
              <p className="text-sm text-gray-300 mt-2">
                Keep your favourites organized
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900">Create Account</h2>

            <p className="text-gray-500 mt-3">
              Join the community and start exploring
            </p>
          </div>

          {/* GOOGLE BUTTON */}
          <button
            type="button"
            onClick={sign_with_google}
            disabled={googleLoading || isSubmitting}
            aria-busy={googleLoading}
            className="mt-8 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-gray-300 p-3 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              className="w-5 h-5"
              aria-hidden="true"
              focusable="false"
            >
              <path
                fill="#fbbb00"
                d="M113.47 309.408 95.648 375.94l-65.139 1.378C11.042 341.211 0 299.9 0 256c0-42.451 10.324-82.483 28.624-117.732h.014L86.63 148.9l25.404 57.644c-5.317 15.501-8.215 32.141-8.215 49.456.002 18.792 3.406 36.797 9.651 53.408z"
              />
              <path
                fill="#518ef8"
                d="M507.527 208.176C510.467 223.662 512 239.655 512 256c0 18.328-1.927 36.206-5.598 53.451-12.462 58.683-45.025 109.925-90.134 146.187l-.014-.014-73.044-3.727-10.338-64.535c29.932-17.554 53.324-45.025 65.646-77.911h-136.89V208.176h245.899z"
              />
              <path
                fill="#28b446"
                d="m416.253 455.624.014.014C372.396 490.901 316.666 512 256 512c-97.491 0-182.252-54.491-225.491-134.681l82.961-67.91c21.619 57.698 77.278 98.771 142.53 98.771 28.047 0 54.323-7.582 76.87-20.818l83.383 68.262z"
              />
              <path
                fill="#f14336"
                d="m419.404 58.936-82.933 67.896C313.136 112.246 285.552 103.82 256 103.82c-66.729 0-123.429 42.957-143.965 102.724l-83.397-68.276h-.014C71.23 56.123 157.06 0 256 0c62.115 0 119.068 22.126 163.404 58.936z"
              />
            </svg>

            <span className="font-medium text-gray-700">
              {googleLoading ? 'Signing in with Google…' : 'Continue with Google'}
            </span>
          </button>

          <div className="relative my-6">
            <div className="border-t"></div>

            <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-3 text-sm text-gray-400">
              OR
            </span>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit(handleRegister)} aria-busy={isSubmitting} className="space-y-5">
            {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
            <div>
              <label htmlFor="register-name" className="text-sm font-medium text-gray-700">
                Full Name
              </label>

              <input
                id="register-name"
                type="text"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'register-name-error' : undefined}
                {...register('name', { onChange: () => setFormError('') })}
                placeholder="Enter your name"
                className="mt-2 w-full rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-black"
              />

              {errors.name && (
                <p id="register-name-error" role="alert" className="text-red-700 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="register-email" className="text-sm font-medium text-gray-700">Email</label>

              <input
                id="register-email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'register-email-error' : undefined}
                {...register('email', { onChange: () => setFormError('') })}
                placeholder="Enter your email"
                className="mt-2 w-full rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-black"
              />

              {errors.email && (
                <p id="register-email-error" role="alert" className="text-red-700 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="register-password" className="text-sm font-medium text-gray-700">
                Password
              </label>

              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'register-password-error' : undefined}
                {...register('password', { onChange: () => setFormError('') })}
                placeholder="Enter password"
                className="mt-2 w-full rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-black"
              />

              {errors.password && (
                <p id="register-password-error" role="alert" className="text-red-700 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="register-confirm-password" className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>

              <input
                id="register-confirm-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
                {...register('confirmPassword', { onChange: () => setFormError('') })}
                placeholder="Confirm password"
                className="mt-2 w-full rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-black"
              />

              {errors.confirmPassword && (
                <p id="register-confirm-password-error" role="alert" className="text-red-700 text-sm mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || googleLoading}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-black py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-black font-semibold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
