import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden">
            <div className="flex-1 flex flex-col h-full">
                <Header />
                <main className="flex flex-1 min-h-0">
                    <Sidebar />
                    <div className="flex-1 bg-white shadow-[0_-4px_16px_-6px_rgba(0,0,0,0.1)] rounded-tl-2xl overflow-y-auto">
                        <div className="w-full min-h-full">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}