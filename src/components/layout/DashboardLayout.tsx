import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { WorkflowProvider } from '@/contexts/workflow-context';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <WorkflowProvider>
            <div className="flex h-screen overflow-hidden">
                <div className="flex-1 flex h-full">
                    <Sidebar />
                    <main className="flex flex-col flex-1 min-h-0 bg-white shadow-[0_-4px_16px_-6px_rgba(0,0,0,0.1)] rounded-tl-2xl overflow-y-auto mt-2">
                        <Header />
                        <div className="flex-1 ">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </WorkflowProvider>
    );
}