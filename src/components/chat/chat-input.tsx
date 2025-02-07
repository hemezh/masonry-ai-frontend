import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useRef } from "react"
import { useOS } from "@/hooks/use-os"
import { ArrowUpIcon, ArrowPathIcon } from "@heroicons/react/24/outline"

interface ChatInputProps {
    prompt: string;
    hasStarted: boolean;
    onPromptChange: (newPrompt: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
}
  

export function ChatInput({ prompt, hasStarted, onPromptChange, onSubmit, isLoading }: ChatInputProps) {
    const os = useOS()
    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                formRef.current?.requestSubmit()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    const shortcutHint = os === 'macos' ? '⌘ + Enter' : 'Ctrl + Enter'

    return (
        <form ref={formRef} onSubmit={onSubmit} className="relative">
            <Textarea
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder={
                    hasStarted
                        ? "Type your message..."
                        : "e.g., Create a workflow to process incoming invoices and update our accounting system"
                }
                rows={4}
                className="w-full p-4 pr-12 resize-none shadow-md"
                disabled={isLoading}
            />
            <div className="absolute right-2 top-2 flex flex-col items-end gap-2">
                <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                        <ArrowUpIcon className="h-5 w-5" />
                    )}
                </Button>
                <span className="text-xs text-zinc-500">{shortcutHint}</span>
            </div>
        </form>
    )
} 