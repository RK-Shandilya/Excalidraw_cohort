import { ExcalidrawElement } from '@/draw/types/types';
import { useState } from 'react';

interface SelectionBoxProps {
  element: ExcalidrawElement;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
  };
  onResize: (x: number, y: number, width: number, height: number) => void;
  onRotate: (angle: number) => void;
  zoom: number;
}

export default function SelectionBox({ element, bounds, onResize, onRotate, zoom }: SelectionBoxProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [startBounds, setStartBounds] = useState(bounds);

  const HANDLE_SIZE = 8;
  const ROTATION_HANDLE_DISTANCE = 20;

  // Normalize bounds to account for zoom
  const normalizedBounds = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    angle: bounds.angle
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'resize' | 'rotate', position?: string) => {
    e.stopPropagation();
    const startPoint = { x: e.clientX, y: e.clientY };
    setStartPoint(startPoint);
    setStartBounds({ ...normalizedBounds });

    if (type === 'resize') {
      setIsResizing(true);
    } else if (type === 'rotate') {
      setIsRotating(true);
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (type === 'resize' && position) {
        const dx = (e.clientX - startPoint.x) / zoom;
        const dy = (e.clientY - startPoint.y) / zoom;
        
        // Apply the element's rotation to the delta coordinates
        const angle = (startBounds.angle * Math.PI) / 180;
        const rotatedDx = dx * Math.cos(angle) + dy * Math.sin(angle);
        const rotatedDy = -dx * Math.sin(angle) + dy * Math.cos(angle);
    
        // Calculate new bounds in world coordinates
        let newX = startBounds.x;
        let newY = startBounds.y;
        let newWidth = startBounds.width;
        let newHeight = startBounds.height;
    
        // Maintain aspect ratio if Shift key is pressed
        const maintainAspectRatio = e.shiftKey;
    
        if (position.includes('w')) {
          newX = startBounds.x + rotatedDx;
          newWidth = startBounds.width - rotatedDx;
        }
        if (position.includes('e')) {
          newWidth = startBounds.width + rotatedDx;
        }
        if (position.includes('n')) {
          newY = startBounds.y + rotatedDy;
          newHeight = startBounds.height - rotatedDy;
        }
        if (position.includes('s')) {
          newHeight = startBounds.height + rotatedDy;
        }
    
        if (maintainAspectRatio) {
          const aspectRatio = startBounds.width / startBounds.height;
          if (position.includes('w') || position.includes('e')) {
            newHeight = newWidth / aspectRatio;
          } else if (position.includes('n') || position.includes('s')) {
            newWidth = newHeight * aspectRatio;
          }
        }
    
        // Handle negative dimensions
        if (newWidth < 0) {
          newX += newWidth;
          newWidth = Math.abs(newWidth);
        }
        if (newHeight < 0) {
          newY += newHeight;
          newHeight = Math.abs(newHeight);
        }
    
        // Ensure minimum size
        if (newWidth >= 1 && newHeight >= 1) {
          onResize(newX, newY, newWidth, newHeight);
        }
      } else if (type === 'rotate') {
        // Calculate center point of the element
        const centerX = startBounds.x + startBounds.width / 2;
        const centerY = startBounds.y + startBounds.height / 2;
    
        // Calculate angles from center to start and current points
        const startAngle = Math.atan2(
          startPoint.y - (centerY * zoom),
          startPoint.x - (centerX * zoom)
        );
        const currentAngle = Math.atan2(
          e.clientY - (centerY * zoom),
          e.clientX - (centerX * zoom)
        );
        
        // Calculate rotation delta and add to starting angle
        let deltaAngle = ((currentAngle - startAngle) * 180) / Math.PI;
        
        // Snap to 15-degree intervals if Shift is held
        if (e.shiftKey) {
          deltaAngle = Math.round(deltaAngle / 15) * 15;
        }
        
        const newAngle = ((startBounds.angle + deltaAngle) % 360 + 360) % 360;
        onRotate(newAngle);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setIsRotating(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const getResizeHandles = () => {
    const positions = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    return positions.map(pos => ({
      position: pos,
      cursor: `${pos}-resize`,
      x: pos.includes('w') ? -HANDLE_SIZE / 2 :
         pos.includes('e') ? normalizedBounds.width - HANDLE_SIZE / 2 :
         normalizedBounds.width / 2 - HANDLE_SIZE / 2,
      y: pos.includes('n') ? -HANDLE_SIZE / 2 :
         pos.includes('s') ? normalizedBounds.height - HANDLE_SIZE / 2 :
         normalizedBounds.height / 2 - HANDLE_SIZE / 2
    }));
  };

  return (

      <div 
        className="absolute pointer-events-none"
        style={{
          top: bounds.y + bounds.height / 2,
          left: bounds.x + bounds.width / 2,
          width: bounds.width,
          height: bounds.height,
          transform: `translate(-50%, -50%) rotate(${bounds.angle}deg)`,
          transformOrigin: 'center',
        }}
        data-selection-box
      >    
      <div className="absolute inset-0 border-2 border-blue-500 border-dashed" />
      
      {getResizeHandles().map((handle, index) => (
        <div
          key={index}
          className="absolute bg-white border-2 border-blue-500 pointer-events-auto"
          style={{
            cursor: handle.cursor,
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            transform: `translate(${handle.x}px, ${handle.y}px)`,
          }}
          onMouseDown={(e) => handleMouseDown(e, 'resize', handle.position)}
        />
      ))}

      <div
        className="absolute left-1/2 bg-white border-2 border-blue-500 rounded-full pointer-events-auto"
        style={{
          width: HANDLE_SIZE,
          height: HANDLE_SIZE,
          transform: `translate(-${HANDLE_SIZE / 2}px, -${ROTATION_HANDLE_DISTANCE + HANDLE_SIZE}px)`,
          cursor: 'grab',
        }}
        onMouseDown={(e) => handleMouseDown(e, 'rotate')}
        data-rotation-handle
      />

      <div
        className="absolute left-1/2 w-0.5 bg-blue-500"
        style={{
          height: ROTATION_HANDLE_DISTANCE,
          transform: 'translateX(-50%)',
          top: -ROTATION_HANDLE_DISTANCE,
        }}
      />
    </div>
  );
}