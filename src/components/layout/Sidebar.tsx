'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { WorkspaceSwitcher } from '@/components/layout/workspace/workspace-switcher';
import { NavigationMenu } from '@/components/layout/navigation/navigation-menu';
import { UserMenu } from '@/components/layout/user/user-menu';
import { CreateWorkspaceDialog } from '@/components/layout/workspace/create-workspace-dialog';

export default function Sidebar() {
    const { user, signOut } = useAuth();
    const { workspaces, currentWorkspace, setCurrentWorkspace, createWorkspace, isLoading } = useWorkspace();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');

    // Get user's initials for avatar fallback
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase();
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleCreateWorkspace = async () => {
        try {
            const workspace = await createWorkspace(newWorkspaceName, newWorkspaceDescription);
            setCurrentWorkspace(workspace);
            setIsCreateDialogOpen(false);
            setNewWorkspaceName('');
            setNewWorkspaceDescription('');
        } catch (error) {
            console.error('Error creating workspace:', error);
        }
    };

    return (
        <div className="hidden md:flex max-h-screen">
            <div className="w-64">
                <div className="flex h-full flex-col border-border/10 bg-background">
                    <div className="flex flex-col overflow-y-auto overflow-x-hidden h-full">
                        <div className="flex items-center min-w-[16rem] px-4 py-4 gap-4">
                            {/* Logo */}
                            <svg
                                className="h-8 w-8 text-foreground"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <rect x="3" y="3" width="8" height="8" rx="1" className="fill-current" />
                                <rect x="13" y="3" width="8" height="8" rx="1" className="fill-current" />
                                <rect x="3" y="13" width="8" height="8" rx="1" className="fill-current" />
                                <rect x="13" y="13" width="8" height="8" rx="1" className="fill-current" />
                            </svg>

                            <WorkspaceSwitcher 
                                currentWorkspace={currentWorkspace} 
                                onCreateNew={() => setIsCreateDialogOpen(true)} 
                            />
                        </div>
                        <NavigationMenu />
                    </div>
                    <UserMenu />
                </div>
            </div>

            <CreateWorkspaceDialog 
                isOpen={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                workspaceName={newWorkspaceName}
                workspaceDescription={newWorkspaceDescription}
                onWorkspaceNameChange={setNewWorkspaceName}
                onWorkspaceDescriptionChange={setNewWorkspaceDescription}
                onCreateWorkspace={handleCreateWorkspace}
            />
        </div>
    );
}