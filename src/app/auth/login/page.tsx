import { LoginForm } from '@/components/auth/login-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your account',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center px-4 py-8">
      <div className="w-full max-w-[350px] space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
} 