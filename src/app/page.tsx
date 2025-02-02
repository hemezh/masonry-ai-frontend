import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed w-full top-0 bg-background/80 backdrop-blur-sm border-b border-neutral-200/20 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl">Masonry</div>
          <div className="flex gap-4">
            <a
              href="/login"
              className="px-4 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Login
            </a>
            <a
              href="/signup"
              className="px-4 py-2 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              Sign Up
            </a>
          </div>
        </div>
      </header>

      <main className="pt-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-neutral-400 bg-clip-text text-transparent">
              Your AI Operations Partner for Seamless Workflows
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8">
              Masonry intelligently manages your operations, automates workflows, and
              orchestrates tasks with the precision and reliability you need.
            </p>
            <div className="flex gap-4">
              <a
                href="/signup"
                className="px-6 py-3 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity font-medium"
              >
                Get Started Free
              </a>
              <a
                href="/demo"
                className="px-6 py-3 rounded-lg border border-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-medium"
              >
                Book a Demo
              </a>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-neutral-200/20 bg-neutral-50 dark:bg-neutral-900">
              <h3 className="text-lg font-semibold mb-2">Smart Automation</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Let AI handle your repetitive tasks and complex workflows with
                intelligent automation.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-neutral-200/20 bg-neutral-50 dark:bg-neutral-900">
              <h3 className="text-lg font-semibold mb-2">Seamless Integration</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Connect with your existing tools and platforms for a unified
                operational experience.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-neutral-200/20 bg-neutral-50 dark:bg-neutral-900">
              <h3 className="text-lg font-semibold mb-2">Real-time Insights</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Get actionable insights and analytics to optimize your workflows
                and improve efficiency.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
