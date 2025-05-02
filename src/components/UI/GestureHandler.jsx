/* src/components/UI/GestureHandler.jsx */
import React, { useRef, useEffect } from 'react';

const GestureHandler = ({ 
  onSwipeLeft, 
  onSwipeRight,
  children,
  threshold = 100,
  disabled = false
}) => {
  const containerRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;
    
    const handleTouchStart = (e) => {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e) => {
      if (touchStartXRef.current === null || touchStartYRef.current === null) {
        return;
      }
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartXRef.current;
      const deltaY = touchEndY - touchStartYRef.current;
      
      // Only recognize horizontal swipes (ignore if vertical movement is greater)
      if (Math.abs(deltaY) > Math.abs(deltaX) * 0.8) {
        return;
      }
      
      if (deltaX > threshold && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < -threshold && onSwipeLeft) {
        onSwipeLeft();
      }
      
      touchStartXRef.current = null;
      touchStartYRef.current = null;
    };
    
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold, disabled]);
  
  return (
    <div ref={containerRef} style={{ height: '100%' }}>
      {children}
    </div>
  );
};

export default GestureHandler;