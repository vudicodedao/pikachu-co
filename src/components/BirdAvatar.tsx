import React from 'react';

interface BirdAvatarProps {
  size?: number; // Kích thước pixel
  className?: string;
  animate?: boolean;
}

export const BirdAvatar: React.FC<BirdAvatarProps> = ({
  size = 64,
  className = '',
  animate = true,
}) => {
  return (
    <div
      className={`relative inline-block select-none ${animate ? 'animate-bounce' : ''} ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* Đuôi chim ở phía sau */}
      <div
        className="absolute bg-amber-600 border border-amber-800 rounded-sm"
        style={{
          width: `${size * 0.22}px`,
          height: `${size * 0.25}px`,
          left: `0px`,
          top: `${size * 0.42}px`,
          clipPath: 'polygon(100% 0, 0 50%, 100% 100%)',
        }}
      />

      {/* Thân chim vàng mập */}
      <div
        className="absolute rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-yellow-300 border-2 border-amber-600 shadow-md"
        style={{
          width: `${size * 0.68}px`,
          height: `${size * 0.52}px`,
          left: `${size * 0.08}px`,
          top: `${size * 0.3}px`,
        }}
      >
        {/* Bụng chim sáng màu */}
        <div
          className="absolute rounded-full bg-yellow-100/90"
          style={{
            width: `${size * 0.38}px`,
            height: `${size * 0.28}px`,
            left: `${size * 0.16}px`,
            top: `${size * 0.14}px`,
          }}
        />

        {/* Cánh chim vỗ */}
        <div
          className="absolute rounded-full bg-amber-400 border border-amber-600 shadow-sm"
          style={{
            width: `${size * 0.34}px`,
            height: `${size * 0.22}px`,
            left: `${size * 0.04}px`,
            top: `${size * 0.1}px`,
            transform: 'rotate(-10deg)',
          }}
        />
      </div>

      {/* ĐẦU CHIM: Khuôn mặt phồng má thổi bong bóng ngộ nghĩnh */}
      <div
        className="absolute rounded-full overflow-hidden border-2 border-amber-400 shadow-lg ring-2 ring-rose-400/50 bg-slate-900"
        style={{
          width: `${size * 0.65}px`,
          height: `${size * 0.65}px`,
          right: `${size * 0.02}px`,
          top: `${size * 0.04}px`,
        }}
      >
        <img
          src="./flappy-face.jpg"
          alt="My baby Phượng Logo"
          className="w-full h-full object-cover scale-110"
        />
      </div>
    </div>
  );
};
