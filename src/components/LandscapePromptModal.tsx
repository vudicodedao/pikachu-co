import React from 'react';
import { Smartphone, RotateCw, Play, Heart } from 'lucide-react';
import { BirdAvatar } from './BirdAvatar';
import { haptics } from '../utils/haptics';

interface LandscapePromptModalProps {
  onDismiss: () => void;
}

export const LandscapePromptModal: React.FC<LandscapePromptModalProps> = ({ onDismiss }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn overscroll-none">
      {/* Hiệu ứng nền nhẹ nhàng */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_30%,rgba(244,63,94,0.18),rgba(255,255,255,0))] pointer-events-none" />

      <div className="relative z-10 max-w-sm flex flex-col items-center space-y-5">
        {/* Mascot chim */}
        <div className="p-2 rounded-3xl bg-slate-900 border-2 border-rose-500/40 shadow-2xl shadow-rose-500/20">
          <BirdAvatar size={68} animate={true} />
        </div>

        {/* Animation điện thoại xoay ngang */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-rose-500/10 animate-ping opacity-30" />
          <div className="animate-rotate-phone text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]">
            <Smartphone className="w-14 h-14" />
          </div>
          <div className="absolute -bottom-1 -right-1 text-amber-300">
            <RotateCw className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        {/* Lời nhắn */}
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black font-arcade text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-pink-300">
            Xoay Ngang Điện Thoại
          </h2>
          <p className="text-xs text-slate-300 font-bold leading-relaxed px-2">
            Bàn cờ Pikachu gồm 18 cột ảnh. Xoay ngang màn hình sẽ giúp bạn gái nhìn to rõ, sắc nét và chạm nối hình dễ dàng nhất!
          </p>
          <div className="text-[11px] text-rose-400 font-semibold flex items-center justify-center gap-1 pt-1">
            <span>Tự động chuyển vào bàn cờ khi xoay ngang</span>
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 inline" />
          </div>
        </div>

        {/* Nút bấm bỏ qua nếu người dùng khóa xoay màn hình */}
        <div className="pt-2 w-full">
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              onDismiss();
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95"
          >
            Vẫn tiếp tục chơi ở màn hình dọc
          </button>
        </div>
      </div>
    </div>
  );
};
