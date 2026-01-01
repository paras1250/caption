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

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) onFileSelect(e.dataTransfer.files[0]);
  }, [onFileSelect]);


  return (
    <div className="flex items-center justify-center w-full">
      <label
        htmlFor="dropzone-file"
        onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
        onDragOver={handleDragOver} onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-96 cursor-pointer mc-panel ${
          isDragging ? 'bg-[#b0b0b0]' : 'bg-[#c6c6c6]'
        }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 mc-text-shadow">
          <UploadCloudIcon className={`w-16 h-16 mb-4 ${isDragging ? 'text-[#ffff55]' : 'text-white'}`} />
          <p className="mb-2 text-4xl text-white">
            SELECT MUSIC FILE
          </p>
          <p className="text-xl text-[#ffff55]">CLICK OR DRAG & DROP</p>
        </div>
        <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="audio/*,video/*" />
      </label>
    </div>
  );
};