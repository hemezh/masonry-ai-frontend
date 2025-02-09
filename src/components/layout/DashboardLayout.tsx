import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { WorkflowProvider } from '@/contexts/workflow-context';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <WorkflowProvider>
            <div className="flex h-screen bg-background">
                <div className="flex-1 flex h-full">
                    <Sidebar />
                    <main className="flex flex-col flex-1 bg-secondary shadow-[0_-4px_16px_-6px_rgba(0,0,0,0.1)] dark:border dark:border-accent  rounded-tl-2xl mt-2">
                        <Header />
                        <div className="flex-1 overflow-y-auto">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </WorkflowProvider>
    );
}