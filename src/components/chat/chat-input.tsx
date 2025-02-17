import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useRef, useState } from "react"
import { useOS } from "@/hooks/use-os"
import { 
    ArrowUpIcon, 
    ArrowPathIcon,
    PaperClipIcon,
    MicrophoneIcon,
    StopIcon,
    XMarkIcon,
    SparklesIcon
} from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

interface ChatInputProps {
    prompt: string;
    hasStarted: boolean;
    onPromptChange: (newPrompt: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
    onAttachmentUpload?: (files: FileList) => void;
    onAudioRecorded?: (blob: Blob) => void;
    className?: string;
}

const SUGGESTIONS = [
    {
        title: "Generate query",
        description: "Generate a query to show all sales last year",
        shortcut: "1",
    },
    {
        title: "Create dashboard",
        description: "Create a dashboard using last year's sales across US states",
        shortcut: "2",
    },
    {
        title: "Share link",
        description: "Create a public shareable link",
        shortcut: "3",
    },
];

export function ChatInput({ 
    prompt, 
    hasStarted, 
    onPromptChange, 
    onSubmit, 
    isLoading,
    onAttachmentUpload,
    onAudioRecorded,
    className
}: ChatInputProps) {
    const os = useOS()
    const formRef = useRef<HTMLFormElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dropZoneRef = useRef<HTMLDivElement>(null)
    const [isRecording, setIsRecording] = useState(false)
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)

    useEffect(() => {
        textareaRef.current?.focus()
    }, [])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                formRef.current?.requestSubmit()
            }
            
            if ((e.key === '/' && document.activeElement === textareaRef.current) || 
                ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
                e.preventDefault()
                setShowSuggestions(true)
            }

            if (e.key >= '1' && e.key <= '3' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                const suggestion = SUGGESTIONS[parseInt(e.key) - 1]
                if (suggestion) {
                    onPromptChange(suggestion.description)
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [onPromptChange])

    const handleFileUpload = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && onAttachmentUpload) {
            onAttachmentUpload(e.target.files)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && onAttachmentUpload) {
            onAttachmentUpload(e.dataTransfer.files)
        }
    }

    const toggleRecording = async () => {
        if (isRecording) {
            mediaRecorder?.stop()
            setIsRecording(false)
            return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)
            
            recorder.ondataavailable = (e) => {
                if (onAudioRecorded) {
                    onAudioRecorded(e.data)
                }
            }

            recorder.start()
            setMediaRecorder(recorder)
            setIsRecording(true)
        } catch (error) {
            console.error('Error accessing microphone:', error)
        }
    }

    return (
        <div 
            ref={dropZoneRef}
            className={cn(
                "relative w-full max-w-3xl mx-auto", // Reduced max-width for better readability
                isDragging && "after:absolute after:inset-0 after:bg-primary/10 after:border-2 after:border-primary/50 after:border-dashed after:rounded-xl",
            )}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
        >
            <form 
                ref={formRef} 
                onSubmit={onSubmit} 
                className="relative group"
            >
                <div className={cn(
                    "relative rounded-lg border",
                    // "shadow-sm transition-shadow duration-200",
                    "hover:shadow-md focus-within:shadow-md focus-within:ring-primary focus-within:ring-2",
                    className
                )}>
                    <div className="relative flex flex-col">
                        <div className="flex-1 relative">
                            <Textarea
                                ref={textareaRef}
                                value={prompt}
                                onChange={(e) => onPromptChange(e.target.value)}
                                placeholder={
                                    hasStarted
                                        ? "Type your message..."
                                        : "Type / for suggestions or start typing..."
                                }
                                rows={3}
                                className={cn(
                                    "w-full resize-none",
                                    "px-4 py-4 pb-0", // Increased right padding for controls
                                    "min-h-[80px] max-h-[400px]", // Adjusted heights
                                    "border-0 focus-visible:ring-0 focus-visible:border-none",
                                    "text-base leading-7", // Adjusted text size and line height
                                    "text-foreground placeholder:text-muted-foreground",
                                    "shadow-none",
                                    "bg-transparent border-none",
                                    "scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800",
                                    isLoading && "opacity-70"
                                )}
                                disabled={isLoading}
                            />
                        </div>
                        
                        <div className="inset-y-0 flex flex-1 items-center justify-end">
                            <div className="flex sticky right-2 bottom-2 items-center gap-1.5 px-2 py-2 rounded-lg">
                                <TooltipProvider delayDuration={150}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleFileUpload}
                                                className="h-9 w-9 rounded-lg hover:bg-accent/50"
                                            >
                                                <PaperClipIcon className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs">
                                            <p>Attach files (⌘+U)</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-lg hover:bg-accent/50"
                                        >
                                            <SparklesIcon className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0" align="end">
                                        <Command>
                                            <CommandGroup>
                                                {SUGGESTIONS.map((suggestion) => (
                                                    <CommandItem
                                                        key={suggestion.title}
                                                        onSelect={() => {
                                                            onPromptChange(suggestion.description)
                                                            setShowSuggestions(false)
                                                        }}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <div>
                                                            <p>{suggestion.title}</p>
                                                            <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                                                        </div>
                                                        <kbd className="ml-4 text-xs bg-muted px-1.5 py-0.5 rounded">
                                                            ⌘{suggestion.shortcut}
                                                        </kbd>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>

                                <TooltipProvider delayDuration={150}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={toggleRecording}
                                                className={cn(
                                                    "h-9 w-9 rounded-lg hover:bg-accent/50",
                                                    isRecording && "text-red-500 animate-pulse"
                                                )}
                                            >
                                                {isRecording ? (
                                                    <StopIcon className="h-4 w-4" />
                                                ) : (
                                                    <MicrophoneIcon className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs">
                                            <p>{isRecording ? "Stop recording" : "Record audio (⌘+R)"}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                {isLoading ? (
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="h-9 w-9 rounded-lg hover:bg-accent/50"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={isLoading || !prompt.trim()}
                                        className={cn(
                                            "h-9 w-9 rounded-lg",
                                            "bg-primary text-primary-foreground",
                                            "transition-all duration-200 ease-in-out",
                                            "hover:bg-primary/90 hover:scale-105",
                                            "active:scale-95",
                                            "disabled:opacity-50 disabled:hover:scale-100",
                                            "shadow-sm hover:shadow-md",
                                            (!prompt.trim() || isLoading) && "opacity-50 scale-95"
                                        )}
                                    >
                                        <ArrowUpIcon className={cn(
                                            "h-4 w-4",
                                            "transition-transform duration-200 ease-in-out",
                                            "group-hover:translate-y-[-2px]"
                                        )} />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                />
            </form>
        </div>
    );
}