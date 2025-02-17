import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useWorkspace } from '@/contexts/workspace-context';
import { uploadService, FileUpload } from '@/services/upload';
import { formatBytes } from '@/lib/utils';
import { DocumentIcon, ArrowDownTrayIcon, TrashIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface FileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FileDrawer({ isOpen, onClose }: FileDrawerProps) {
    const { currentWorkspace } = useWorkspace();
    const [files, setFiles] = useState<FileUpload[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        console.log('FileDrawer effect - isOpen:', isOpen, 'currentWorkspace:', currentWorkspace);
        if (isOpen && currentWorkspace) {
            loadFiles();
        } else {
            // Reset files when drawer closes
            setFiles([]);
        }
    }, [isOpen, currentWorkspace]);

    const loadFiles = async () => {
        if (!currentWorkspace) return;
        
        setIsLoading(true);
        try {
            console.log('Loading files for workspace:', currentWorkspace.id);
            const response = await uploadService.listFiles(currentWorkspace.id);
            console.log('Files response:', response);
            setFiles(response || []);
        } catch (error) {
            console.error('Error loading files:', error);
            toast({
                title: 'Error',
                description: 'Failed to load files',
                variant: 'destructive',
            });
            setFiles([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async (file: FileUpload) => {
        if (!currentWorkspace) return;
        const downloadUrl = uploadService.getDownloadUrl(currentWorkspace.id, file.id);
        window.open(downloadUrl, '_blank');
    };

    const handleDelete = async (file: FileUpload) => {
        if (!currentWorkspace) return;

        try {
            await uploadService.deleteFile(currentWorkspace.id, file.id);
            await loadFiles(); // Reload the files list
            toast({
                title: 'Success',
                description: 'File deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting file:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete file',
                variant: 'destructive',
            });
        }
    };

    const handleOpenChat = (file: FileUpload) => {
        if (!currentWorkspace || !file.source || !file.sourceId) return;
        onClose(); // Close the drawer first
        router.push(`/dashboard/chat/${file.sourceId}`);
    };

    console.log('FileDrawer render - files:', files, 'isLoading:', isLoading);

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>Files</SheetTitle>
                </SheetHeader>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : files && files.length > 0 ? (
                        <div className="space-y-2">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center space-x-3 min-w-0">
                                        <DocumentIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{file.fileName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatBytes(file.fileSize)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {file.source === 'chat' && file.sourceId && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenChat(file)}
                                                title="Open chat"
                                            >
                                                <ChatBubbleLeftIcon className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDownload(file)}
                                            title="Download file"
                                        >
                                            <ArrowDownTrayIcon className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(file)}
                                            title="Delete file"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            No files uploaded yet
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
} 