import React from 'react';

interface SuperheroAvatarProps {
  size?: number; // pixel width/height
  animate?: boolean;
}

export const SuperheroAvatar: React.FC<SuperheroAvatarProps> = ({ size = 64, animate = true }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center select-none ${
        animate ? 'hover:scale-105 transition-transform' : ''
      }`}
    >
      {/* Áo choàng đỏ bay bồng bềnh */}
      <div
        className={`absolute inset-x-2 -bottom-1 h-3/5 bg-gradient-to-b from-rose-600 to-red-800 rounded-b-2xl shadow-lg shadow-rose-900/40 transform origin-top ${
          animate ? 'animate-pulse' : ''
        }`}
        style={{
          clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 50% 90%, 0% 100%)',
          zIndex: 1,
        }}
      />

      {/* Thân siêu nhân chibi (bộ giáp xanh dương & vàng) */}
      <div
        className="absolute bottom-1 w-3/5 h-1/2 bg-gradient-to-b from-sky-500 via-blue-600 to-indigo-700 rounded-2xl flex flex-col items-center justify-end pb-1 border border-sky-300/60 shadow-md"
        style={{ zIndex: 2 }}
      >
        {/* Biểu tượng Trái Tim Vàng trước ngực */}
        <div className="w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[8px] font-black shadow-sm mb-1">
          ★
        </div>
        {/* Thắt lưng vàng */}
        <div className="w-full h-1.5 bg-amber-400 border-t border-amber-300" />
      </div>

      {/* Hai bàn tay giơ lên sẵn sàng hứng */}
      <div
        className="absolute bottom-4 -left-0.5 w-2.5 h-2.5 rounded-full bg-amber-300 border border-amber-500 shadow-sm"
        style={{ zIndex: 3 }}
      />
      <div
        className="absolute bottom-4 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-300 border border-amber-500 shadow-sm"
        style={{ zIndex: 3 }}
      />

      {/* Đầu siêu nhân: Khuôn mặt của bạn nam với kính */}
      <div
        className="absolute top-0 w-3/5 h-3/5 rounded-full overflow-hidden border-2 border-amber-400 shadow-lg bg-slate-900 flex items-center justify-center"
        style={{ zIndex: 4 }}
      >
        <img
          src="./hero-face.jpg"
          alt="Superhero Hero Head"
          className="w-full h-full object-cover select-none pointer-events-none"
          onError={(e) => {
            (e.target as HTMLImageElement).src = './flappy-face.jpg';
          }}
        />
      </div>

      {/* Vương miện / Vầng sáng siêu nhân trên đầu */}
      <div
        className="absolute -top-1 w-2 h-2 rounded-full bg-amber-300 blur-[1px] animate-ping pointer-events-none"
        style={{ zIndex: 5 }}
      />
    </div>
  );
};
