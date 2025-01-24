import { Suspense } from 'react';
import { ArrowUpIcon, ArrowDownIcon, QuestionMarkCircleIcon, UserIcon, PuzzlePieceIcon, CheckIcon } from '@heroicons/react/24/solid';

// Mock data - replace with actual data fetching
const metrics = {
    activeAutomations: 12,
    successfulRuns: 156,
    failedRuns: 3,
    queuedDocuments: 8,
};

const chartdata = [
    { date: 'Mon', runs: 34 },
    { date: 'Tue', runs: 42 },
    { date: 'Wed', runs: 38 },
    { date: 'Thu', runs: 45 },
    { date: 'Fri', runs: 40 },
    { date: 'Sat', runs: 35 },
    { date: 'Sun', runs: 30 },
];

const activities = [
    { id: 1, type: 'automation', name: 'Invoice Processing', status: 'completed', timestamp: new Date(2024, 2, 15) },
    { id: 2, type: 'integration', name: 'Slack Connector', status: 'failed', timestamp: new Date(2024, 2, 14) },
    // Add more activities...
];

interface MetricCardProps {
    title: string;
    value: number;
    trend: {
        value: string;
        direction: 'up' | 'down';
    };
    attention?: boolean;
}

export default function DashboardPage() {
    return (
        <div className="space-y-4 p-8">
            {/* Title */}
            <div className="mb-8 max-w-7xl mx-auto">
                <h1 className="text-2xl font-semibold text-zinc-900">Welcome to Masonry</h1>
                <p className="text-sm text-zinc-500">Let's get started with automating your workflows</p>
            </div>

            {/* Main Action Card */}
            <div className="mb-8 max-w-7xl mx-auto">
                <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-purple-50 via-white to-purple-50/50 p-8 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.05),transparent)] pointer-events-none" />
                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-2xl font-medium text-zinc-900 mb-3">Create Your First Automation</h2>
                        <p className="text-zinc-600 mb-6 text-lg">Start automating your workflows by creating your first automation pipeline.</p>
                        <a
                            href="/dashboard/automations/new"
                            className="inline-flex items-center rounded-lg bg-purple-600 px-6 py-3 text-sm font-medium text-white hover:bg-purple-700 transition-colors shadow-sm hover:shadow"
                        >
                            Get Started
                        </a>
                    </div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:block opacity-10">
                        <svg width="320" height="320" viewBox="0 0 24 24" fill="currentColor" className="text-purple-900">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Onboarding Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 max-w-7xl mx-auto">
                {/* Integrations Card */}
                <div className="rounded-xl border border-zinc-200 p-8 bg-gradient-to-br from-blue-50 via-white to-white relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_107%,rgba(59,130,246,0.05),transparent)] pointer-events-none opacity-100 group-hover:opacity-80 transition-opacity" />
                    <div className="relative z-10">
                        <div className="mb-6">
                            <PuzzlePieceIcon className="h-10 w-10 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-medium text-zinc-900 mb-3">Connect Your Tools</h3>
                        <p className="text-zinc-600 mb-6">Integrate with your favorite tools and services to enhance your workflows.</p>
                        <a
                            href="/dashboard/integrations"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
                        >
                            Browse Integrations
                            <span className="ml-2 transition-transform group-hover:translate-x-0.5">→</span>
                        </a>
                    </div>
                </div>

                {/* Team Invite Card */}
                <div className="rounded-xl border border-zinc-200 p-8 bg-gradient-to-br from-green-50 via-white to-white relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_107%,rgba(34,197,94,0.05),transparent)] pointer-events-none opacity-100 group-hover:opacity-80 transition-opacity" />
                    <div className="relative z-10">
                        <div className="mb-6">
                            <UserIcon className="h-10 w-10 text-green-500" />
                        </div>
                        <h3 className="text-xl font-medium text-zinc-900 mb-3">Invite Your Team</h3>
                        <p className="text-zinc-600 mb-6">Collaborate with your team members to build and manage automations together.</p>
                        <a
                            href="/dashboard/settings/team"
                            className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center"
                        >
                            Invite Members
                            <span className="ml-2 transition-transform group-hover:translate-x-0.5">→</span>
                        </a>
                    </div>
                </div>

                {/* Documentation Card */}
                <div className="rounded-xl border border-zinc-200 p-8 bg-gradient-to-br from-orange-50 via-white to-white relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_107%,rgba(249,115,22,0.05),transparent)] pointer-events-none opacity-100 group-hover:opacity-80 transition-opacity" />
                    <div className="relative z-10">
                        <div className="mb-6">
                            <QuestionMarkCircleIcon className="h-10 w-10 text-orange-500" />
                        </div>
                        <h3 className="text-xl font-medium text-zinc-900 mb-3">Learn the Basics</h3>
                        <p className="text-zinc-600 mb-6">Explore our documentation to learn how to make the most of Masonry.</p>
                        <a
                            href="/docs"
                            className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center"
                        >
                            View Documentation
                            <span className="ml-2 transition-transform group-hover:translate-x-0.5">→</span>
                        </a>
                    </div>
                </div>

            </div>
            {/* Pricing Plans */}
            <div className="py-16">
                <div className="flex flex-col items-center mb-8">
                    <h2 className="text-3xl font-bold text-zinc-900 mb-3">Simple, Transparent Pricing</h2>
                    <p className="text-zinc-600 text-lg max-w-2xl text-center">Choose the plan that best fits your needs. All plans include core features with additional capabilities as you grow.</p>

                    {/* Billing Toggle */}
                    <div className="flex items-center gap-4 mt-6 bg-zinc-100 p-1 rounded-lg">
                        <button className="px-4 py-2 rounded-md bg-white text-sm font-medium shadow-sm">Monthly</button>
                        <button className="px-4 py-2 rounded-md text-sm font-medium text-zinc-700">Annual (Save 20%)</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* Free Plan */}
                    <div className="rounded-xl border border-zinc-200 p-8 bg-white hover:shadow-lg transition-shadow relative">
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-zinc-900 mb-2">Free</h3>
                            <p className="text-zinc-600">Perfect for getting started</p>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">$0</span>
                                <span className="text-zinc-600">/month</span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center text-zinc-700">
                                <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                <span>5 automations</span>
                            </li>
                            <li className="flex items-center text-zinc-700">
                                <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                <span>1,000 runs/month</span>
                            </li>
                            <li className="flex items-center text-zinc-700">
                                <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                <span>Community support</span>
                            </li>
                            <li className="flex items-center text-zinc-700">
                                <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                <span>Basic integrations</span>
                            </li>
                        </ul>

                        <a href="/dashboard/billing" className="block w-full text-center px-6 py-3 rounded-lg border-2 border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 font-medium transition-colors">
                            Current Plan
                        </a>
                    </div>

                    {/* Pro Plan */}
                    <div className="rounded-xl border-2 border-purple-500 p-8 bg-white hover:shadow-lg transition-shadow relative">
                        <div className="absolute top-0 right-8 transform -translate-y-1/2">
                            <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">Most Popular</span>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-zinc-900 mb-2">Pro</h3>
                            <p className="text-zinc-600">For growing teams and businesses</p>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">$29</span>
                                <span className="text-zinc-600">/month</span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center text-zinc-700">
                                <CheckIcon className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                                <span><strong>Unlimited</strong> automations</span>
                            </li>
                            <li className="flex items-center text-zinc-700">
                                <CheckIcon className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                                <span>10,000 runs/month</span>
                            </li>
                            <li className="flex items-center text-zinc-700">
                                <CheckIcon className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                                <span>Priority email support</span>
                            </li>
                            <li className="flex items-center text-zinc-700">
                                <CheckIcon className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                                <span>Advanced integrations</span>
                            </li>
                            <li className="flex items-center text-zinc-700">
                                <CheckIcon className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                                <span>Team collaboration tools</span>
                            </li>
                        </ul>

                        <a href="/dashboard/billing" className="block w-full text-center px-6 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium transition-colors">
                            Upgrade to Pro
                        </a>
                    </div>

                    {/* Enterprise Plan */}
                    <div className="rounded-xl border border-zinc-200 p-8 bg-white hover:shadow-lg transition-shadow relative">
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-zinc-900 mb-2">Enterprise</h3>
                            <p className="text-zinc-600">For large-scale operations</p>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">Custom</span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center text-zinc-700">
                                <CheckIcon className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                                <span>Everything in Pro, plus:</span>
                            </li>
                            <li className="flex items-center text-zinc-700">
                                <CheckIcon className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                                <span>Unlimited runs</span>
                            </li>
                            <li className="flex items-center text-zinc-700">
                                <CheckIcon className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                                <span>24/7 phone support</span>
                            </li>
                            <li className="flex items-center text-zinc-700">
                                <CheckIcon className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                                <span>Custom integrations</span>
                            </li>
                            <li className="flex items-center text-zinc-700">
                                <CheckIcon className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                                <span>Dedicated success manager</span>
                            </li>
                        </ul>

                        <a href="/contact" className="block w-full text-center px-6 py-3 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 font-medium transition-colors">
                            Contact Sales
                        </a>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-zinc-600 mb-4">All plans include: Secure data encryption, 99.9% uptime SLA, API access</p>
                    <a href="/pricing" className="text-purple-600 hover:text-purple-700 font-medium">
                        View full plan comparison →
                    </a>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, trend, attention = false }: MetricCardProps) {
    return (
        <div className={`rounded-lg border p-4 ${attention ? 'border-t-4 border-t-red-500' : 'border-t-4 border-t-blue-500'}`}>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
            <div className="mt-4 flex items-center space-x-2">
                <span>
                    {trend.direction === 'up' ? (
                        <ArrowUpIcon className="h-4 w-4 text-green-500" />
                    ) : (
                        <ArrowDownIcon className="h-4 w-4 text-red-500" />
                    )}
                </span>
                <span className="text-sm text-gray-500">{trend.value}</span>
            </div>
        </div>
    )
} 