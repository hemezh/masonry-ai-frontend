import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { WorkflowProvider } from '@/contexts/workflow-context';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <WorkflowProvider>
            <div className="h-screen bg-background w-screen overflow-hidden">
                <div className="grid grid-cols-[auto_1fr] h-full w-full">
                    <Sidebar />
                    <main className="flex flex-col min-w-0 bg-card shadow-[0_-4px_16px_-6px_rgba(0,0,0,0.1)] dark:border-l dark:border-t dark:border-border rounded-tl-2xl mt-2 overflow-hidden">
                        <Header />
                        <div className="flex-1 min-w-0 w-full overflow-y-auto overflow-x-hidden">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </WorkflowProvider>
    );
}