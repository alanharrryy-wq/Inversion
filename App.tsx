import React, { useState, useEffect } from 'react'; 
import Background from './components/Background';
import Scaler from './components/Scaler';
import SlideRenderer from './components/SlideRenderer';
import Modal from './components/Modal';
import AIChat from './components/AIChat';

const TOTAL_SLIDES = 20; // V34.0.0: antes 20

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalTitle, setModalTitle] = useState('');

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalOpen) return; // Let modal handle its own keys

      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, modalOpen]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % TOTAL_SLIDES);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const openModal = (images: string[], title: string) => {
    setModalImages(images);
    setModalTitle(title);
    setModalOpen(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-main">
      {/* 3D Background */}
      <Background />

      {/* Main Content Scaler (1600x900 Fixed Ratio) */}
      <Scaler>
        <div className="w-full h-full relative [perspective:1000px]">
          <SlideRenderer 
            index={currentSlide} 
            totalSlides={TOTAL_SLIDES}
            nextSlide={nextSlide}
            prevSlide={prevSlide}
            goToSlide={goToSlide}
            openModal={openModal}
          />
        </div>
      </Scaler>

      {/* Evidence Modal */}
      {modalOpen && (
        <Modal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          images={modalImages} 
          title={modalTitle} 
        />
      )}

      {/* AI Assistant */}
      <AIChat />
    </div>
  );
}
