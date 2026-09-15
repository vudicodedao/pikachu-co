import React, { useEffect, useRef } from 'react';
import { Position } from '../types/game';

interface ConnectLineCanvasProps {
  path: Position[] | null;
  gridRef: React.RefObject<HTMLDivElement | null>;
  totalRows: number;
  totalCols: number;
}

export const ConnectLineCanvas: React.FC<ConnectLineCanvasProps> = ({
  path,
  gridRef,
  totalRows,
  totalCols,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Xóa canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!path || path.length < 2) return;

    const cellWidth = canvas.width / totalCols;
    const cellHeight = canvas.height / totalRows;

    // Lấy tọa độ tâm của từng ô
    const getCenter = (pos: Position) => ({
      x: (pos.c + 0.5) * cellWidth,
      y: (pos.r + 0.5) * cellHeight,
    });

    // Vẽ đường nối phát sáng kiểu Neon Laser
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Lớp vầng sáng ngoài
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#facc15';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 6;

    ctx.beginPath();
    const start = getCenter(path[0]);
    ctx.moveTo(start.x, start.y);

    for (let i = 1; i < path.length; i++) {
      const pt = getCenter(path[i]);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // Lớp lõi sáng trắng bên trong
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Vẽ chấm tròn tại các góc rẽ
    path.forEach((pt) => {
      const center = getCenter(pt);
      ctx.beginPath();
      ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });

    ctx.restore();

    // Tự động xóa sau 220ms
    const timer = setTimeout(() => {
      if (canvasRef.current) {
        const c = canvasRef.current.getContext('2d');
        c?.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [path, totalRows, totalCols]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-30 w-full h-full"
      width={1200}
      height={680}
    />
  );
};
