'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateWorkspaceDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceName: string;
    workspaceDescription: string;
    onWorkspaceNameChange: (value: string) => void;
    onWorkspaceDescriptionChange: (value: string) => void;
    onCreateWorkspace: () => void;
}

export function CreateWorkspaceDialog({
    isOpen,
    onOpenChange,
    workspaceName,
    workspaceDescription,
    onWorkspaceNameChange,
    onWorkspaceDescriptionChange,
    onCreateWorkspace,
}: CreateWorkspaceDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Workspace</DialogTitle>
                    <DialogDescription>
                        Create a new workspace to organize your work and collaborate with others.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={workspaceName}
                            onChange={(e) => onWorkspaceNameChange(e.target.value)}
                            placeholder="Enter workspace name"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={workspaceDescription}
                            onChange={(e) => onWorkspaceDescriptionChange(e.target.value)}
                            placeholder="Enter workspace description"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onCreateWorkspace} disabled={!workspaceName}>
                        Create Workspace
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 