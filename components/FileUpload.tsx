
import React, { useState, useCallback } from 'react';
import { UploadCloudIcon } from './Icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  // FIX: Changed React.DragEvent<HTMLDivElement> to React.DragEvent<HTMLLabelElement> to match the element type.
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  // FIX: Changed React.DragEvent<HTMLDivElement> to React.DragEvent<HTMLLabelElement> to match the element type.
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // FIX: Changed React.DragEvent<HTMLDivElement> to React.DragEvent<HTMLLabelElement> to match the element type.
  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // FIX: Changed React.DragEvent<HTMLDivElement> to React.DragEvent<HTMLLabelElement> to match the element type.
  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);


  return (
    <div className="flex items-center justify-center w-full">
      <label
        htmlFor="dropzone-file"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-96 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          isDragging ? 'border-cyan-400 bg-gray-800' : 'border-gray-600 bg-gray-800/50 hover:bg-gray-800'
        }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadCloudIcon className={`w-12 h-12 mb-4 transition-colors ${isDragging ? 'text-cyan-400' : 'text-gray-400'}`} />
          <p className="mb-2 text-lg font-semibold text-gray-300">
            <span className="font-bold text-cyan-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">MP3, WAV, MP4, MOV (Max. 100MB)</p>
        </div>
        <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="audio/*,video/*" />
      </label>
    </div>
  );
};
