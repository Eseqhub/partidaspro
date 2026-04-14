'use client';

import React, { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faImages, faTimes } from '@fortawesome/free-solid-svg-icons';

interface PhotoUploaderProps {
  onPhotoSelected: (base64String: string | null) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onPhotoSelected }) => {
  const [preview, setPreview] = useState<string | null>(null);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        onPhotoSelected(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onPhotoSelected(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-2 mb-6">
      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">
        Foto do Atleta
      </label>
      
      {preview ? (
        <div className="relative w-full h-48 bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black transition-all"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Câmera */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 bg-white/5 border border-white/10 p-4 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-all group"
          >
            <FontAwesomeIcon icon={faCamera} className="text-2xl text-white/40 group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Tirar Foto</span>
          </button>

          {/* Galeria */}
          <input
            type="file"
            accept="image/*"
            ref={galleryInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex-1 bg-white/5 border border-white/10 p-4 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-all group"
          >
            <FontAwesomeIcon icon={faImages} className="text-2xl text-white/40 group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Abrir Galeria</span>
          </button>
        </div>
      )}
    </div>
  );
};
