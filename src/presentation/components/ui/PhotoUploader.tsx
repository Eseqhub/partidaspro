'use client';

import React, { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faImages, faTimes, faMagnifyingGlassPlus, faMagnifyingGlassMinus } from '@fortawesome/free-solid-svg-icons';

interface PhotoUploaderProps {
  onPhotoSelected: (base64String: string | null) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onPhotoSelected }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  
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
    setZoom(1);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-2 mb-6">
      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">
        Foto do Atleta
      </label>
      
      {preview ? (
        <div className="flex flex-col gap-3">
            <div className="relative w-full h-48 bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center">
                <img 
                    src={preview} 
                    alt="Preview" 
                    className="transition-transform duration-200 ease-out" 
                    style={{ transform: `scale(${zoom})`, objectFit: 'cover', width: '100%', height: '100%' }}
                />
                <button
                    type="button"
                    onClick={handleRemove}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black transition-all z-10"
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>
            
            <div className="flex items-center gap-4 px-2">
                <FontAwesomeIcon icon={faMagnifyingGlassMinus} className="text-white/20 text-xs" />
                <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.1" 
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-primary"
                />
                <FontAwesomeIcon icon={faMagnifyingGlassPlus} className="text-white/20 text-xs" />
                <span className="text-[10px] font-black text-primary min-w-[30px]">{zoom}x</span>
            </div>
            <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest text-center">ARRASTE O ZOOM PARA AJUSTAR O ROSTO NO CÍRCULO</p>
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
            className="flex-1 bg-white/5 border border-white/10 p-6 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-all group"
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
            className="flex-1 bg-white/5 border border-white/10 p-6 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-all group"
          >
            <FontAwesomeIcon icon={faImages} className="text-2xl text-white/40 group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Galeria</span>
          </button>
        </div>
      )}
    </div>
  );
};
