import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Modal } from './Modal';
import { Button } from './Button';
import { getCroppedImg, compressAvatar } from '@/presentation/utils/ImageUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrop, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: string | null;
  onCropComplete: (compressedBase64: string) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  onClose,
  image,
  onCropComplete,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((crop: any) => {
    setCrop(crop);
  }, []);

  const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!image || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      
      if (croppedBlob) {
        const compressedBase64 = await compressAvatar(croppedBlob);
        onCropComplete(compressedBase64);
        onClose();
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao processar imagem. Tente outra foto.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AJUSTAR AVATAR">
      <div className="flex flex-col gap-6">
        <div className="relative w-full h-[300px] bg-black/40 border border-white/10 rounded-xl overflow-hidden">
          {image && (
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1 / 1}
              onCropChange={onCropChange}
              onCropComplete={onCropCompleteInternal}
              onZoomChange={setZoom}
              cropShape="round"
              showGrid={false}
              style={{
                containerStyle: { background: '#000' },
                cropAreaStyle: { border: '2px solid var(--primary, #ccff00)' }
              }}
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 px-2">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 border-white/10 text-white/40 hover:text-white"
            >
              <FontAwesomeIcon icon={faTimes} className="mr-2" /> CANCELAR
            </Button>
            <Button 
                onClick={handleSave} 
                className="flex-1 bg-primary text-black font-black"
                disabled={isProcessing}
            >
                {isProcessing ? (
                    'PROCESSANDO...'
                ) : (
                    <>
                        <FontAwesomeIcon icon={faCheck} className="mr-2" /> CONFIRMAR
                    </>
                )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
