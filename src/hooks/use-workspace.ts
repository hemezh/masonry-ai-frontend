import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { workspaceService } from '@/services/workspace-service';

export function useWorkspace() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const { data: workspace, isLoading, error } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceId ? workspaceService.getWorkspace(workspaceId) : null,
    enabled: !!workspaceId,
  });

  return {
    workspace,
    isLoading,
    error,
  };
} 