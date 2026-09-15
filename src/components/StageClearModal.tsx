import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, ArrowRight, Trophy, Heart } from 'lucide-react';
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
  useEffect(() => {
    if (isOpen) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.25)] p-6 text-center text-slate-100 flex flex-col items-center gap-4">
        {/* Biểu tượng chiến thắng */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/40 animate-bounce">
          {isLastStage ? (
            <Heart className="w-9 h-9 text-rose-600 fill-rose-600" />
          ) : (
            <Award className="w-9 h-9 text-slate-950 stroke-[2.5]" />
          )}
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-100 font-arcade">
            {isLastStage ? 'PHÁ ĐẢO TOÀN DIỆN!' : 'XUẤT SẮC QUA MÀN!'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isLastStage
              ? 'Bạn đã hoàn thành xuất sắc tất cả 8 màn chơi thử thách!'
              : `Bạn đã chinh phục thành công ${stageConfig.name}!`}
          </p>
        </div>

        {/* Bảng điểm */}
        <div className="w-full p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
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
        <div className="w-full pt-2">
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/30"
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
