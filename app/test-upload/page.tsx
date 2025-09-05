"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Upload, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function TestUploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Test with a real lead ID from your system
  const TEST_LEAD_ID = "7fd5a23c-be24-4870-9fab-103b803e912d"; // Test lead: first last

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      console.log('🚀 Starting upload:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('leadId', TEST_LEAD_ID);
      formData.append('fileType', 'document'); // Simple category
      formData.append('category', 'general'); // Simple category

      // Use your dual storage API
      const response = await fetch('/api/files/upload-dual', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Upload failed with status ${response.status}`);
      }

      if (result.success) {
        console.log('✅ Upload successful:', result);
        setUploadResult(result);
        toast({
          title: "Success!",
          description: `File "${file.name}" uploaded successfully`,
        });
      } else {
        throw new Error(result.message || 'Upload failed');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      console.error('❌ Upload error:', err);
      setError(errorMessage);
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">File Upload Test</h1>
          <p className="text-gray-600">
            Testing the dual storage upload system (Vercel Blob + Google Drive)
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Test Lead ID: <code className="bg-gray-100 px-2 py-1 rounded">{TEST_LEAD_ID}</code>
          </p>
        </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Upload a file</h3>
              <p className="text-gray-600 mb-4">
                Click to select any file type. No categories needed!
              </p>
              
              <Button 
                onClick={handleFileSelect}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </>
                )}
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept="*/*"
          />
        </div>

        {/* Results */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <h4 className="font-medium text-red-800">Upload Failed</h4>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {uploadResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-800 mb-2">Upload Successful!</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <span className="font-medium">File:</span> {uploadResult.data?.name}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span> {(uploadResult.data?.size / 1024).toFixed(1)} KB
                    </div>
                    <div>
                      <span className="font-medium">Storage:</span> {uploadResult.data?.storageLocation}
                    </div>
                    {uploadResult.data?.blobUrl && (
                      <div>
                        <span className="font-medium">Blob URL:</span>{' '}
                        <a 
                          href={uploadResult.data.blobUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {uploadResult.data.blobUrl}
                        </a>
                      </div>
                    )}
                    {uploadResult.data?.driveUrl && (
                      <div>
                        <span className="font-medium">Drive URL:</span>{' '}
                        <a 
                          href={uploadResult.data.driveUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {uploadResult.data.driveUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Raw JSON for debugging */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Show raw response
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(uploadResult, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">How this works:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Uses your existing DualFileStorageService</li>
            <li>• Uploads to both Vercel Blob (fast) and Google Drive (backup)</li>
            <li>• No category selection needed - just upload</li>
            <li>• Uses service account for Google Drive (no user auth needed)</li>
            <li>• Creates database record with dual storage info</li>
          </ul>
        </div>
      </div>
    </div>
  );
}