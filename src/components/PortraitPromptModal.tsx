import React from 'react';
import { Smartphone, RotateCcw, Heart } from 'lucide-react';
import { BirdAvatar } from './BirdAvatar';
import { haptics } from '../utils/haptics';

interface PortraitPromptModalProps {
  onDismiss: () => void;
}

export const PortraitPromptModal: React.FC<PortraitPromptModalProps> = ({ onDismiss }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn overflow-y-auto custom-scrollbar">
      {/* Hiệu ứng nền nhẹ nhàng */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_30%,rgba(245,158,11,0.18),rgba(255,255,255,0))] pointer-events-none" />

      {/* Thẻ thông báo bố cục ngang (Horizontal card) tối ưu hoàn hảo cho màn hình xoay ngang */}
      <div className="relative z-10 max-w-lg w-full flex flex-row items-center gap-4 sm:gap-6 p-4 sm:p-5 bg-slate-900/95 border border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
        {/* Cột trái: Mascot chim & Animation điện thoại xoay dọc */}
        <div className="flex flex-col items-center justify-center shrink-0 gap-2.5">
          <div className="p-1.5 rounded-2xl bg-slate-950 border border-amber-500/40 shadow-lg shadow-amber-500/20">
            <BirdAvatar size={50} animate={true} />
          </div>

          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-amber-500/15 animate-ping opacity-40" />
            <div className="animate-rotate-phone-portrait text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]">
              <Smartphone className="w-9 h-9" />
            </div>
            <div className="absolute -bottom-1 -right-1 text-rose-400">
              <RotateCcw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
        </div>

        {/* Cột phải: Nội dung văn bản & Nút thao tác */}
        <div className="flex-1 flex flex-col items-start text-left space-y-2">
          <div>
            <h2 className="text-base sm:text-lg font-black font-arcade text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-pink-300 leading-tight">
              Xoay Dọc Điện Thoại
            </h2>
            <p className="text-xs text-slate-300 font-medium leading-relaxed mt-1">
              Flappy Bird được thiết kế chuẩn arcade dọc (tỉ lệ 2:3). Xoay dọc điện thoại để có tầm nhìn bay thoáng và điều khiển chim mượt mà nhất nhé!
            </p>
          </div>

          <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
            <span>Tự động vào game khi xoay dọc</span>
            <Heart className="w-3 h-3 fill-rose-500 text-rose-500 inline shrink-0" />
          </div>

          {/* Nút bấm bỏ qua nếu người dùng khóa xoay màn hình */}
          <div className="pt-1 w-full">
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                onDismiss();
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95 text-center"
            >
              Vẫn tiếp tục chơi ở màn hình ngang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
