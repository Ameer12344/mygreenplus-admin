import { Recycle, Mail, Lock, AlertCircle } from 'lucide-react';
import { login } from './actions';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-950 px-4 relative overflow-hidden">
      {/* Ambient glow — quiet, not loud */}
      <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-forest-700/30 blur-3xl" />
      <div className="absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-acid/10 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-acid flex items-center justify-center">
            <Recycle className="w-5 h-5 text-forest-950" strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-xl text-white tracking-tight">
            MyGreenPlus
          </span>
        </div>

        <div className="bg-white rounded-xl2 shadow-card p-8">
          <h1 className="font-display font-semibold text-2xl text-ink mb-1">
            Admin sign in
          </h1>
          <p className="text-sage-400 text-sm mb-6">
            Operations dashboard access only.
          </p>

          {searchParams.error && (
            <div className="flex items-start gap-2 bg-rose-50 text-rose-600 text-sm rounded-lg px-3 py-2.5 mb-5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{searchParams.error}</span>
            </div>
          )}

          <form action={login} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-sage-400 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-sage-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@mygreenplus.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-sage-200 text-sm text-ink placeholder:text-sage-400/70 focus:border-forest-700 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-sage-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-sage-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-sage-200 text-sm text-ink placeholder:text-sage-400/70 focus:border-forest-700 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-forest-900 hover:bg-forest-700 text-white font-medium text-sm rounded-lg py-2.5 transition-colors"
            >
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-sage-400/70 text-xs mt-6">
          Access is restricted to MyGreenPlus admin accounts.
        </p>
      </div>
    </div>
  );
}
