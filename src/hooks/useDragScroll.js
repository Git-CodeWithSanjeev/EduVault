import { useRef, useCallback } from 'react';

/**
 * Custom hook providing smooth mouse drag-to-scroll functionality for horizontal carousels.
 */
export function useDragScroll() {
  const trackRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const scroll = useCallback((direction, amount = 380) => {
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -amount : amount;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }, []);

  const onMouseDown = useCallback((e) => {
    if (!trackRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - trackRef.current.offsetLeft;
    scrollLeft.current = trackRef.current.scrollLeft;
    trackRef.current.style.cursor = 'grabbing';
    trackRef.current.style.userSelect = 'none';
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.4;
    trackRef.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  const stopDrag = useCallback(() => {
    isDragging.current = false;
    if (trackRef.current) {
      trackRef.current.style.cursor = 'grab';
      trackRef.current.style.userSelect = '';
    }
  }, []);

  return {
    trackRef,
    scroll,
    dragProps: {
      onMouseDown,
      onMouseMove,
      onMouseUp: stopDrag,
      onMouseLeave: stopDrag,
    },
  };
}
