import React, { useState, useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  title: string;
}

/**
 * Resuelve la ruta real de la imagen:
 * - URL completa (http, /, data:) → se usa tal cual
 * - Nombre con extensión → assets/<nombre>
 * - Nombre sin extensión → assets/<nombre>.jpg
 */
function resolveImageSrc(raw: string): string {
  if (!raw) return '';

  const trimmed = raw.trim();

  // URL absoluta o data URL
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  const hasExtension = /\.[a-zA-Z0-9]+$/.test(trimmed);

  if (hasExtension) {
    // Ya viene con .jpg/.png/.webp/etc
    return `assets/${trimmed}`;
  }

  // Por defecto, usamos .jpg como estándar
  return `assets/${trimmed}.jpg`;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, images, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');

  const zoomRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset index cuando se abre
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  // Actualiza source cuando cambia index o lista de imágenes
  useEffect(() => {
    if (images.length > 0) {
      const raw = images[currentIndex];
      setCurrentSrc(resolveImageSrc(raw));
    } else {
      setCurrentSrc('');
    }
  }, [currentIndex, images]);

  // Navegación por teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentIndex, images.length]);

  const nextImage = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomRef.current || !imgRef.current) return;

    const rect = zoomRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    imgRef.current.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    imgRef.current.style.transform = 'scale(2.5)';
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    if (!imgRef.current) return;
    imgRef.current.style.transform = 'scale(1)';
    setIsZooming(false);

    setTimeout(() => {
      if (imgRef.current && !isZooming) {
        imgRef.current.style.transformOrigin = 'center center';
      }
    }, 100);
  };

  const handleError = () => {
    if (!currentSrc.includes('picsum.photos')) {
      console.warn(
        `[HITECH MODAL] No se pudo cargar la imagen "${images[currentIndex]}". Se muestra placeholder.`
      );
      setCurrentSrc(
        `https://picsum.photos/1600/900?text=EVIDENCE+NOT+FOUND&random=${currentIndex}`
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/95 z-50 flex items-center justify-center animate-fade-up">
      <div
        className="relative w-[95%] h-[95%] border-2 border-gold bg-[#050505] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="w-full h-[60px] bg-[#151515] border-b border-gold flex justify-between items-center px-8 shrink-0 z-10">
          <h3 className="text-gold font-code text-xl m-0">{title}</h3>

          {images.length > 1 && (
            <div className="text-cyan font-code text-2xl font-bold">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          <button
            onClick={onClose}
            className="bg-[#900] text-white border border-red-500 px-5 py-2 font-display font-bold hover:bg-red-600 transition-colors"
          >
            CERRAR [X]
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 relative overflow-hidden flex justify-center items-center">
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-cyan text-5xl p-2 z-20 hover:bg-black/80"
            >
              &#10094;
            </button>
          )}

          <div
            id="zoom-wrapper"
            ref={zoomRef}
            className="relative w-full h-full flex justify-center items-center overflow-hidden cursor-zoom-in"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {currentSrc ? (
              <img
                ref={imgRef}
                src={currentSrc}
                onError={handleError}
                alt="Evidence"
                className="max-w-full max-h-full object-contain transition-transform duration-100 ease-out"
              />
            ) : (
              <div className="text-gray-500 font-code text-lg">
                No hay imágenes para mostrar.
              </div>
            )}

            {!isZooming && currentSrc && (
              <div className="absolute top-2 right-2 text-cyan/60 text-xs border border-cyan/30 px-2 rounded bg-black/60 pointer-events-none">
                HOVER PARA ZOOM
              </div>
            )}
          </div>

          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-cyan text-5xl p-2 z-20 hover:bg-black/80"
            >
              &#10095;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
