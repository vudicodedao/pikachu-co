import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowRight, Trophy, Heart, Sparkles, Image as ImageIcon } from 'lucide-react';
import { StageConfig } from '../types/game';

interface StageClearModalProps {
  isOpen: boolean;
  stageConfig: StageConfig;
  score: number;
  timeBonus: number;
  isLastStage: boolean;
  onNextStage: () => void;
  onRestartGame: () => void;
}

export const StageClearModal: React.FC<StageClearModalProps> = ({
  isOpen,
  stageConfig,
  score,
  timeBonus,
  isLastStage,
  onNextStage,
  onRestartGame,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setImgError(false);
      // Bắn pháo hoa ăn mừng
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      const timeout = setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);

      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const baseUrl = import.meta.env.BASE_URL || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const winImgUrl = `${cleanBase}win.jpg`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-2xl shadow-[0_0_50px_rgba(244,63,94,0.25)] p-6 text-center text-slate-100 flex flex-col items-center gap-4">
        {/* Câu chúc mừng theo đúng yêu cầu */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
            <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400 animate-pulse" />
            <span>XUẤT SẮC QUA MÀN</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-pink-200 to-amber-300 leading-snug pt-1">
            Chút Mừn Em bé iu Thúy Phượng đã hoàn thành màn {stageConfig.stage}
          </h2>
        </div>

        {/* Khung ảnh chiến thắng (mặc định nền xám, khi có ảnh win.jpg sẽ tự hiển thị) */}
        <div className="w-full h-52 sm:h-60 rounded-xl overflow-hidden border-2 border-slate-700/80 bg-slate-800/80 flex items-center justify-center relative shadow-inner group">
          {!imgError ? (
            <img
              src={winImgUrl}
              alt="Ảnh chiến thắng"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover select-none transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 gap-2 p-4">
              <div className="p-3 rounded-full bg-slate-700/50 text-slate-400">
                <ImageIcon className="w-8 h-8 opacity-70" />
              </div>
              <span className="text-xs font-semibold text-slate-400">
                (Khung ảnh chiến thắng - Đang chờ nạp ảnh của bạn)
              </span>
              <span className="text-[10px] text-slate-500">
                File: public/win.jpg
              </span>
            </div>
          )}
        </div>

        {/* Bảng điểm */}
        <div className="w-full p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-400">
            <span>Thưởng thời gian nhanh:</span>
            <span className="font-bold text-emerald-400">+{timeBonus.toLocaleString()}</span>
          </div>
          <div className="border-t border-slate-800/80 pt-2 flex justify-between items-center">
            <span className="flex items-center gap-1.5 text-slate-300 font-bold">
              <Trophy className="w-4 h-4 text-amber-400" />
              Tổng điểm hiện tại:
            </span>
            <span className="text-base font-extrabold text-amber-400">
              {score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="w-full pt-1">
          {isLastStage ? (
            <button
              type="button"
              onClick={onRestartGame}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-extrabold text-xs transition-all cursor-pointer shadow-lg shadow-rose-500/30"
            >
              Chơi lại từ đầu
            </button>
          ) : (
            <button
              type="button"
              onClick={onNextStage}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 hover:from-rose-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-500/30"
            >
              <span>Tiến vào màn kế tiếp</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
