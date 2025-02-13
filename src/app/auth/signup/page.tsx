import { SignUpForm } from '@/components/auth/signup-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a new account',
};

export default function SignUpPage() {
  return (
    <main className="min-h-screen grid place-items-center px-4 py-8">
      <div className="w-full max-w-[350px] space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your information to get started
          </p>
        </div>
        <SignUpForm />
      </div>
    </main>
  );
} 