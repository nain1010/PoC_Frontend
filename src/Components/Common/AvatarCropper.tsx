import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Label } from 'reactstrap';

interface AvatarCropperProps {
  isOpen: boolean;
  toggle: () => void;
  imageSrc: string;
  onSave: (croppedBase64: string) => void;
}

const AvatarCropper: React.FC<AvatarCropperProps> = ({ isOpen, toggle, imageSrc, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  const CANVAS_SIZE = 280;
  const OUTPUT_SIZE = 256;

  // Load image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw checkerboard background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Calculate image dimensions to fit within canvas with zoom
    const aspect = image.width / image.height;
    let drawWidth, drawHeight;

    if (aspect >= 1) {
      // Landscape or square
      drawHeight = CANVAS_SIZE * zoom;
      drawWidth = drawHeight * aspect;
    } else {
      // Portrait
      drawWidth = CANVAS_SIZE * zoom;
      drawHeight = drawWidth / aspect;
    }

    const x = (CANVAS_SIZE - drawWidth) / 2 + offsetX;
    const y = (CANVAS_SIZE - drawHeight) / 2 + offsetY;

    ctx.drawImage(image, x, y, drawWidth, drawHeight);

    // Draw circular mask overlay
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Draw circle border
    ctx.strokeStyle = '#405189';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.stroke();

  }, [image, zoom, offsetX, offsetY]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragging(true);
    setDragStart({ x: touch.clientX - offsetX, y: touch.clientY - offsetY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const touch = e.touches[0];
    setOffsetX(touch.clientX - dragStart.x);
    setOffsetY(touch.clientY - dragStart.y);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handleSave = () => {
    if (!image) return;

    // Create output canvas at desired resolution
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = OUTPUT_SIZE;
    outputCanvas.height = OUTPUT_SIZE;
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return;

    // Calculate scaled dimensions
    const scale = OUTPUT_SIZE / CANVAS_SIZE;
    const aspect = image.width / image.height;
    let drawWidth, drawHeight;

    if (aspect >= 1) {
      drawHeight = OUTPUT_SIZE * zoom;
      drawWidth = drawHeight * aspect;
    } else {
      drawWidth = OUTPUT_SIZE * zoom;
      drawHeight = drawWidth / aspect;
    }

    const x = (OUTPUT_SIZE - drawWidth) / 2 + offsetX * scale;
    const y = (OUTPUT_SIZE - drawHeight) / 2 + offsetY * scale;

    // Draw image
    ctx.drawImage(image, x, y, drawWidth, drawHeight);

    // Apply circular clip
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    const croppedBase64 = outputCanvas.toDataURL('image/png', 0.9);
    onSave(croppedBase64);
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="sm">
      <ModalHeader toggle={toggle} className="bg-light p-3">
        <i className="ri-crop-line me-2"></i>Ajustar Foto de Perfil
      </ModalHeader>
      <ModalBody className="p-4 text-center">
        <p className="text-muted fs-13 mb-3">
          Arrastra para mover y usa el slider para hacer zoom.
        </p>

        <div
          ref={containerRef}
          style={{
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            margin: '0 auto',
            cursor: dragging ? 'grabbing' : 'grab',
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          onWheel={handleWheel}
        >
          <canvas ref={canvasRef} style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }} />
        </div>

        <div className="mt-4 px-3">
          <div className="d-flex align-items-center gap-2">
            <i className="ri-zoom-out-line text-muted fs-18"></i>
            <Input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="form-range flex-grow-1"
            />
            <i className="ri-zoom-in-line text-muted fs-18"></i>
          </div>
          <small className="text-muted">Zoom: {Math.round(zoom * 100)}%</small>
        </div>
      </ModalBody>
      <ModalFooter className="bg-light">
        <Button color="light" onClick={toggle}>Cancelar</Button>
        <Button color="primary" onClick={handleSave}>
          <i className="ri-check-line me-1"></i>Guardar Foto
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AvatarCropper;
