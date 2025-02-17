import { apiClient } from '@/lib/api-client';

export interface FileUploadResponse {
    id: string;
    workspace_id: string;
    storage_id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    bucket_path: string;
    public_url: string;
    source?: string;
    source_id?: string;
    created_at: string;
    updated_at: string;
}

export interface FileUpload {
    id: string;
    workspaceId: string;
    storageId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    bucketPath: string;
    publicURL: string;
    source?: string;
    sourceId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface FileResponse {
    data: FileUploadResponse;
}

export interface FilesListResponse {
    data: FileUploadResponse[];
}

export interface UploadFileParams {
    workspaceId: string;
    file: File;
    source?: 'chat' | 'table';
    source_id?: string;
}

const transformFileResponse = (file: FileUploadResponse): FileUpload => {
    console.log('Transforming file response:', file);
    const transformed = {
        id: file.id,
        workspaceId: file.workspace_id,
        storageId: file.storage_id,
        fileName: file.file_name,
        fileSize: file.file_size,
        mimeType: file.mime_type,
        bucketPath: file.bucket_path,
        publicURL: file.public_url,
        source: file.source,
        sourceId: file.source_id,
        createdAt: file.created_at,
        updatedAt: file.updated_at,
    };
    console.log('Transformed file:', transformed);
    return transformed;
};

class UploadService {
    private BASE_PATH = '/workspaces';

    // List all files in a workspace
    async listFiles(workspaceId: string, source?: string, source_id?: string): Promise<FileUpload[]> {
        const params = new URLSearchParams();
        if (source) params.append('source', source);
        if (source_id) params.append('source_id', source_id);
        
        console.log('Fetching files for workspace:', workspaceId);
        const response = await apiClient.get<FileUploadResponse[]>(
            `${this.BASE_PATH}/${workspaceId}/files${params.toString() ? `?${params.toString()}` : ''}`
        );
        console.log('Raw API response:', response.data);
        
        if (!Array.isArray(response.data)) {
            console.warn('Unexpected API response format:', response.data);
            return [];
        }
        
        const transformedFiles = response.data.map(transformFileResponse);
        console.log('Transformed files:', transformedFiles);
        return transformedFiles;
    }

    // Upload a file
    async uploadFile({ workspaceId, file, source, source_id }: UploadFileParams): Promise<FileUpload> {
        const formData = new FormData();
        formData.append('file', file);
        if (source) formData.append('source', source);
        if (source_id) formData.append('source_id', source_id);

        const response = await apiClient.post<FileUploadResponse>(
            `${this.BASE_PATH}/${workspaceId}/files`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return transformFileResponse(response.data);
    }

    // Get file details
    async getFile(workspaceId: string, fileId: string): Promise<FileUpload> {
        const response = await apiClient.get<FileUploadResponse>(
            `${this.BASE_PATH}/${workspaceId}/files/${fileId}`
        );
        return transformFileResponse(response.data);
    }

    // Delete a file
    async deleteFile(workspaceId: string, fileId: string): Promise<void> {
        await apiClient.delete(`${this.BASE_PATH}/${workspaceId}/files/${fileId}`);
    }

    // Get download URL
    getDownloadUrl(workspaceId: string, fileId: string): string {
        return `${apiClient.defaults.baseURL}${this.BASE_PATH}/${workspaceId}/files/${fileId}/download`;
    }
}

export const uploadService = new UploadService(); 