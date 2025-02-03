import React from 'react';
import { ExcalidrawElement } from '@/draw/types/types';

interface SelectionBoxProps {
  element: ExcalidrawElement;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
  };
  onResize: (width: number, height: number) => void;
  onRotate: (angle: number) => void;
}

const SelectionBox: React.FC<SelectionBoxProps> = ({ element, bounds, onResize, onRotate }) => {
  const { x, y, width, height, angle } = bounds;

  const HANDLE_SIZE = 8;
  const HANDLE_OFFSET = HANDLE_SIZE / 2;
  const ROTATION_HANDLE_OFFSET = 24;

  // Handle resize logic
  const handleResize = (e: React.MouseEvent, handle: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = width;
    const startHeight = height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
  
      let newWidth = startWidth;
      let newHeight = startHeight;
  
      switch (handle) {
        case 'top-left':
          newWidth = startWidth - deltaX;
          newHeight = startHeight - deltaY;
          break;
        case 'top-right':
          newWidth = startWidth + deltaX;
          newHeight = startHeight - deltaY;
          break;
        case 'bottom-left':
          newWidth = startWidth - deltaX;
          newHeight = startHeight + deltaY;
          break;
        case 'bottom-right':
          newWidth = startWidth + deltaX;
          newHeight = startHeight + deltaY;
          break;
      }
  
      onResize(Math.max(1, newWidth), Math.max(1, newHeight));
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Handle rotation logic
  const handleRotate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startAngle = Math.atan2(e.clientY - (y + height / 2), e.clientX - (x + width / 2));

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      const currentAngle = Math.atan2(moveEvent.clientY - (y + height / 2), moveEvent.clientX - (x + width / 2));
      const deltaAngle = currentAngle - startAngle;
      onRotate(angle + deltaAngle);
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      data-selection-box
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: `${x - HANDLE_OFFSET}px`,
        top: `${y - HANDLE_OFFSET}px`,
        width: `${width + HANDLE_SIZE}px`,
        height: `${height + HANDLE_SIZE}px`,
        border: '1.5px solid #007BFF',
        transform: `rotate(${angle}rad)`,
        transformOrigin: 'center center',
        pointerEvents: 'none',
      }}
    >
      {/* Resize Handles */}
      <div
        data-selection-box
        style={{
          position: 'absolute',
          left: '-4px',
          top: '-4px',
          width: `${HANDLE_SIZE}px`,
          height: `${HANDLE_SIZE}px`,
          backgroundColor: '#007BFF',
          border: '1.5px solid #007BFF',
          cursor: 'nwse-resize',
          pointerEvents: 'auto',
        }}
        onMouseDown={(e) => handleResize(e, 'top-left')}
      />
      <div
        data-selection-box
        style={{
          position: 'absolute',
          right: '-4px',
          top: '-4px',
          width: `${HANDLE_SIZE}px`,
          height: `${HANDLE_SIZE}px`,
          border: '1.5px solid #007BFF',
          backgroundColor: '#007BFF',
          cursor: 'nesw-resize',
          pointerEvents: 'auto',
        }}
        onMouseDown={(e) => handleResize(e, 'top-right')}
      />
      <div
        data-selection-box
        style={{
          position: 'absolute',
          left: '-4px',
          bottom: '-4px',
          width: `${HANDLE_SIZE}px`,
          height: `${HANDLE_SIZE}px`,
          border: '1.5px solid #007BFF',
          backgroundColor: '#007BFF',
          cursor: 'nesw-resize',
          pointerEvents: 'auto',
        }}
        onMouseDown={(e) => handleResize(e, 'bottom-left')}
      />
      <div
        data-selection-box
        style={{
          position: 'absolute',
          bottom: '-4px',
          right: '-4px',
          width: `${HANDLE_SIZE}px`,
          height: `${HANDLE_SIZE}px`,
          backgroundColor: '#007BFF',
          border: '1.5px solid #007BFF',
          cursor: 'nwse-resize',
          pointerEvents: 'auto',
        }}
        onMouseDown={(e) => handleResize(e, 'bottom-right')}
      />

      {/* Rotation Handle */}
      <div
        data-rotation-handle
        style={{
          position: 'absolute',
          left: '50%',
          top: `-${ROTATION_HANDLE_OFFSET}px`,
          width: `${HANDLE_SIZE}px`,
          height: `${HANDLE_SIZE}px`,
          backgroundColor: 'white',
          border: '1.5px solid #007BFF',
          borderRadius: '50%',
          cursor: 'grab',
          transform: 'translateX(-50%)',
          pointerEvents: 'auto',
        }}
        onMouseDown={handleRotate}
      />
    </div>
  );
};

export default SelectionBox;