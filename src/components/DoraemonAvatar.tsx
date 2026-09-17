import React from 'react';

interface DoraemonAvatarProps {
  size?: number; // pixel width/height
  animate?: boolean;
}

export const DoraemonAvatar: React.FC<DoraemonAvatarProps> = ({ size = 64, animate = true }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center select-none ${
        animate ? 'hover:scale-105 transition-transform' : ''
      }`}
    >
      {/* 1. CHONG CHÓNG TRE (BAMBOO COPTER) TRÊN ĐỈNH ĐẦU */}
      <div
        className="absolute -top-3 sm:-top-3.5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
        style={{ zIndex: 10 }}
      >
        {/* Cánh quạt chong chóng tre 2 cánh quay tít */}
        <div
          className={`w-8 sm:w-10 h-1.5 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 rounded-full shadow-md border border-amber-500/80 ${
            animate ? 'animate-spin' : ''
          }`}
          style={{ animationDuration: '0.6s' }}
        />
        {/* Trục cắm chong chóng tre */}
        <div className="w-1 h-2 bg-amber-400 border-x border-amber-500" />
        {/* Giác hút chân chong chóng tre */}
        <div className="w-3 h-1 bg-amber-500 rounded-full" />
      </div>

      {/* 2. THÂN DORAEMON XANH LAM & TÚI THẦN KỲ */}
      <div
        className="absolute bottom-0 w-3/4 h-1/2 bg-gradient-to-b from-sky-500 to-blue-600 rounded-2xl flex flex-col items-center justify-end pb-1 border-2 border-sky-400/80 shadow-lg"
        style={{ zIndex: 2 }}
      >
        {/* Vòng cổ đỏ của Doraemon */}
        <div className="absolute top-0 w-full h-1.5 bg-rose-600 rounded-t-sm" />

        {/* Quả chuông vàng tròn */}
        <div className="absolute top-1 w-3 h-3 rounded-full bg-yellow-400 border border-amber-500 flex flex-col items-center justify-center shadow-sm">
          <div className="w-2 h-0.5 bg-amber-700 rounded-full" />
          <div className="w-1 h-1 rounded-full bg-slate-900 mt-0.5" />
        </div>

        {/* Bụng trắng hình tròn & Túi thần kỳ bán nguyệt */}
        <div className="w-3/5 h-3/5 rounded-full bg-white border border-slate-200 flex flex-col items-center justify-center mt-2 shadow-inner">
          {/* Túi thần kỳ */}
          <div className="w-4/5 h-1/2 border-t-2 border-slate-400 rounded-b-full bg-slate-50 mt-0.5" />
        </div>
      </div>

      {/* 3. ĐẦU DORAEMON: KHUÔN MẶT BẠN GÁI VỚI VIỀN MŨ MÈO MÁY */}
      <div
        className="absolute top-1 w-3/5 h-3/5 rounded-full p-0.5 bg-gradient-to-br from-sky-400 to-blue-600 border-2 border-amber-300 shadow-xl flex items-center justify-center overflow-hidden"
        style={{ zIndex: 4 }}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center">
          <img
            src="./flappy-face.jpg"
            alt="Doraemon Face"
            className="w-full h-full object-cover select-none pointer-events-none"
            onError={(e) => {
              (e.target as HTMLImageElement).src = './hero-face.jpg';
            }}
          />
        </div>
      </div>

      {/* Đôi tai tròn phụ kiện / hào quang đáng yêu */}
      <div
        className="absolute -top-0.5 w-1.5 h-1.5 rounded-full bg-yellow-300 animate-ping pointer-events-none"
        style={{ zIndex: 11 }}
      />
    </div>
  );
};
