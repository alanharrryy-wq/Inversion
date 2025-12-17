import React, { useEffect, useRef, useState } from 'react';

const Scaler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const baseWidth = 1600;
      const baseHeight = 900;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const scaleX = windowWidth / baseWidth;
      const scaleY = windowHeight / baseHeight;

      // Fit contained
      setScale(Math.min(scaleX, scaleY));
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center overflow-hidden z-10 pointer-events-none">
      <div 
        ref={containerRef}
        style={{
          width: '1600px',
          height: '900px',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          boxShadow: '0 0 150px rgba(0,0,0,0.8)'
        }}
        className="relative pointer-events-auto"
      >
        {children}
      </div>
    </div>
  );
};

export default Scaler;