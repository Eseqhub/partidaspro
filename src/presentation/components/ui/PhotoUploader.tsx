'use client';

import React, { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faImages, faTimes, faCrop } from '@fortawesome/free-solid-svg-icons';
import { ImageCropperModal } from './ImageCropperModal';

interface PhotoUploaderProps {
  onPhotoSelected: (base64String: string | null) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onPhotoSelected }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawImage(reader.result as string);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (compressedBase64: string) => {
    setPreview(compressedBase64);
    onPhotoSelected(compressedBase64);
    
    // Log para verificação (remover em produção)
    const sizeInKb = Math.round(compressedBase64.length * (3 / 4) / 1024);
    console.log(`[PhotoUploader] Imagem processada: ${sizeInKb}kb`);
  };

  const handleRemove = () => {
    setPreview(null);
    setRawImage(null);
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
        <div className="flex flex-col gap-3 animate-in fade-in duration-500">
            <div className="relative w-32 h-32 mx-auto bg-black/40 border border-primary/30 overflow-hidden flex items-center justify-center rounded-3xl shadow-[0_0_20px_rgba(204,255,0,0.1)]">
                <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                />
                <button
                    type="button"
                    onClick={handleRemove}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all z-10"
                >
                    <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                </button>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-primary/20 backdrop-blur-md px-2 py-0.5 rounded text-[7px] font-black text-primary uppercase border border-primary/20">
                    AVATAR PRO
                </div>
            </div>
            
            <button 
                type="button"
                onClick={() => setIsCropperOpen(true)}
                className="text-[8px] text-primary/40 hover:text-primary font-bold uppercase tracking-widest text-center transition-colors flex items-center justify-center gap-2"
            >
                <FontAwesomeIcon icon={faCrop} /> AJUSTAR RECORTE
            </button>
        </div>
      ) : (
        <div className="flex gap-4">
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
            className="flex-1 bg-white/5 border border-white/10 p-6 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-all group rounded-xl"
          >
            <FontAwesomeIcon icon={faCamera} className="text-2xl text-white/40 group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Câmera Live</span>
          </button>

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
            className="flex-1 bg-white/5 border border-white/10 p-6 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-all group rounded-xl"
          >
            <FontAwesomeIcon icon={faImages} className="text-2xl text-white/40 group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Galeria</span>
          </button>
        </div>
      )}

      <ImageCropperModal 
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        image={rawImage}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
