import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera } from '@fortawesome/free-solid-svg-icons';

interface LogoUploaderProps {
  preview: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({ preview, onFileChange }) => (
  <div className="flex flex-col items-center mb-8">
    <div
      className="w-24 h-24 bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center relative cursor-pointer group hover:border-primary/40 transition-all"
      onClick={() => document.getElementById('logo-input')?.click()}
    >
      {preview
        ? <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        : <FontAwesomeIcon icon={faCamera} className="text-white/20 text-2xl" />
      }
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        <span className="text-[8px] font-black text-white uppercase">Mudar Escudo</span>
      </div>
    </div>
    <input id="logo-input" type="file" accept="image/*" className="hidden" onChange={onFileChange} />
  </div>
);
