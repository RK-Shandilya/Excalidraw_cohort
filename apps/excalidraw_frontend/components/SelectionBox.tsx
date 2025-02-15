import { ExcalidrawElement } from '@/draw/types/types';
import { useState, useEffect } from 'react';

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
  const ROTATION_HANDLE_DISTANCE = 24;

  const handleMouseDown = (e: React.MouseEvent, type: 'resize' | 'rotate', position?: string) => {
    e.stopPropagation();
    const startPoint = { x: e.clientX, y: e.clientY };
    setStartPoint(startPoint);
    setStartBounds({ ...bounds });

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
        const angle = (-startBounds.angle * Math.PI) / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const rotatedDx = dx * cos - dy * sin;
        const rotatedDy = dx * sin + dy * cos;
    
        // Calculate new bounds in world coordinates
        let newX = startBounds.x;
        let newY = startBounds.y;
        let newWidth = startBounds.width;
        let newHeight = startBounds.height;
    
        // Maintain aspect ratio if Shift key is pressed
        const aspectRatio = e.shiftKey ? startBounds.width / startBounds.height : null;
    
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
    
        if (aspectRatio !== null) {
          if (position.includes('w') || position.includes('e')) {
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = newHeight * aspectRatio;
          }
        }

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
        const center = {
          x: startBounds.x + startBounds.width / 2,
          y: startBounds.y + startBounds.height / 2
        };
    
        // Calculate angles from center to start and current points
        const startAngle = Math.atan2(
          startPoint.y - center.y * zoom,
          startPoint.x - center.x * zoom
        );
        const currentAngle = Math.atan2(
          e.clientY - center.y * zoom,
          e.clientX - center.x * zoom
        );
        
        // Calculate rotation delta and add to starting angle
        let angleDelta = ((currentAngle - startAngle) * 180) / Math.PI;
        let newAngle = (startBounds.angle + angleDelta) % 360;
        
        // Snap to 15-degree intervals if Shift is held
        if (e.shiftKey) {
          newAngle = Math.round(newAngle / 15) * 15;
        }
        
        if (newAngle < 0) newAngle += 360;
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

  // Get cursor style for resize handles based on rotation
  const getResizeHandles = () => {
    const positions = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    const angle = bounds.angle;
    
    return positions.map(pos => {
      let cursor: string | undefined = pos + '-resize';
      const rotatedAngle = (angle + 180) % 180;
      
      if (rotatedAngle > 22.5 && rotatedAngle <= 67.5) {
        cursor = {
          'nw': 'n-resize', 'n': 'ne-resize', 'ne': 'e-resize',
          'e': 'se-resize', 'se': 's-resize', 'sw': 'w-resize',
          'w': 'nw-resize', 's': 'sw-resize'
        }[pos];
      } else if (rotatedAngle > 67.5 && rotatedAngle <= 112.5) {
        cursor = {
          'nw': 'ne-resize', 'n': 'e-resize', 'ne': 'se-resize',
          'e': 's-resize', 'se': 'sw-resize', 's': 'w-resize',
          'sw': 'nw-resize', 'w': 'n-resize'
        }[pos];
      } else if (rotatedAngle > 112.5 && rotatedAngle <= 157.5) {
        cursor = {
          'nw': 'e-resize', 'n': 'se-resize', 'ne': 's-resize',
          'e': 'sw-resize', 'se': 'w-resize', 's': 'nw-resize',
          'sw': 'n-resize', 'w': 'ne-resize'
        }[pos];
      }

      return {
        position: pos,
        cursor,
        x: pos.includes('w') ? -HANDLE_SIZE/2 :
           pos.includes('e') ? bounds.width - HANDLE_SIZE/2 :
           bounds.width/2 - HANDLE_SIZE/2,
        y: pos.includes('n') ? -HANDLE_SIZE/2 :
           pos.includes('s') ? bounds.height - HANDLE_SIZE/2 :
           bounds.height/2 - HANDLE_SIZE/2
      };
    });
  };

  return (
    <div 
      className="absolute pointer-events-none"
      style={{
        transform: `translate(${bounds.x}px, ${bounds.y}px) rotate(${bounds.angle}deg)`,
        width: bounds.width,
        height: bounds.height,
        transformOrigin: 'center center'
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
          transform: `translate(-${HANDLE_SIZE/2}px, -${ROTATION_HANDLE_DISTANCE + HANDLE_SIZE}px)`,
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