"use client";

import { supabaseClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session?.user) {
          // User is already authenticated, redirect to home
          router.push("/");
        }
      } catch {
        // Session check failed, stay on login page
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleCredentialsLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        router.push("/");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error: signInError } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) {
        setError("Google login failed. Please try again.");
        return
      }

      // Supabase returns a redirect URL in `data.url`. If present, navigate there.
      if (data?.url) {
        window.location.href = data.url
      }
    } catch {
      setError("Google login failed. Please try again.");
    }
  };

  // Show loading state while authentication is being checked
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleCredentialsLogin}>
          {error && (
            <div className="rounded-md bg-red-900/30 p-4 border border-red-700">
              <p className="text-sm font-medium text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign in with Email"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#0a0a0f] text-gray-400">Or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-gray-900 text-sm font-medium text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.449-.901 4.659-2.582 6.278-.828.899-1.288 2.21-1.288 3.662 0 .384.033.773.1 1.152h-3.997c.067-.379.1-.768.1-1.152 0-1.452-.46-2.763-1.288-3.662C5.357 14.243 4.456 12.033 4.456 9.584c0-.546.05-1.081.139-1.602.027-.145.057-.29.088-.433.19-.996.617-1.923 1.23-2.71.607-.775 1.331-1.429 2.148-1.843.817-.415 1.726-.639 2.68-.639 1.316 0 2.562.366 3.63 1.01.652.41 1.244.975 1.749 1.663.47.634.854 1.336 1.13 2.095.277.76.43 1.564.43 2.392 0 .545-.05 1.08-.138 1.601zm0 0" />
          </svg>
          Sign in with Google
        </button>

        <p className="text-center text-sm text-gray-400">
          Don&apos;t have an account?{" "}
          <a href="/register" className="font-medium text-blue-400 hover:text-blue-300">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
