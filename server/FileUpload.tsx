import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';
import apiClient from './api/apiClient'; // Your central axios instance

interface FileUploadProps {
  onUploadComplete: (file: { fileId: string; url: string; thumbnailUrl?: string }) => void;
  purpose: 'PROPERTY_IMAGE' | 'CHAT_ATTACHMENT';
  propertyId?: string;
}

interface UploadableFile {
  file: File;
  id: string;
  progress: number;
  preview: string;
  error?: string;
}

export default function FileUpload({ onUploadComplete, purpose, propertyId }: FileUploadProps) {
  const [files, setFiles] = useState<UploadableFile[]>([]);

  const uploadFile = async (uploadable: UploadableFile) => {
    const { file } = uploadable;
    const toastId = toast.loading(`Uploading ${file.name}...`);

    try {
      // 1. Get presigned URL from our backend
      const presignResponse = await apiClient.post('/files/presign', {
        fileName: file.name,
        fileType: file.type,
        purpose,
        propertyId,
      });

      const { uploadUrl, fileId } = presignResponse.data.data;

      // 2. Upload file to S3 (or local server)
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
          setFiles(prev => prev.map(f => f.id === uploadable.id ? { ...f, progress: percentCompleted } : f));
        },
      });

      // 3. Notify our backend that the upload is complete
      const completeResponse = await apiClient.post('/files/complete', { fileId });

      toast.success(`${file.name} uploaded successfully!`, { id: toastId });
      onUploadComplete(completeResponse.data.data);

      // Remove from local state after successful upload
      setFiles(prev => prev.filter(f => f.id !== uploadable.id));

    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || `Failed to upload ${file.name}.`;
      toast.error(errorMessage, { id: toastId });
      setFiles(prev => prev.map(f => f.id === uploadable.id ? { ...f, error: errorMessage } : f));
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadableFile[] = acceptedFiles.map(file => ({
      file,
      id: `${file.name}-${file.size}-${Date.now()}`,
      progress: 0,
      preview: URL.createObjectURL(file),
    }));

    setFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(uploadFile);
  }, [purpose, propertyId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleRetry = (id: string) => {
    const fileToRetry = files.find(f => f.id === id);
    if (fileToRetry) {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 0, error: undefined } : f));
      uploadFile(fileToRetry);
    }
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {files.map(uploadable => (
          <div key={uploadable.id} className="border rounded-lg p-2 flex items-center space-x-4">
            <img src={uploadable.preview} alt={uploadable.file.name} className="w-16 h-16 object-cover rounded" />
            <div className="flex-1">
              <p className="text-sm font-medium truncate">{uploadable.file.name}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div
                  className={`h-2.5 rounded-full ${uploadable.error ? 'bg-red-500' : 'bg-blue-600'}`}
                  style={{ width: `${uploadable.progress}%` }}
                ></div>
              </div>
              {uploadable.error && (
                <div className="text-red-500 text-xs mt-1 flex items-center">
                  <span>{uploadable.error}</span>
                  <button
                    onClick={() => handleRetry(uploadable.id)}
                    className="ml-2 text-blue-600 hover:underline text-xs"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}