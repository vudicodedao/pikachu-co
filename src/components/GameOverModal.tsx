import React from 'react';
import { Skull, RotateCcw, Play } from 'lucide-react';
import { StageConfig } from '../types/game';

interface GameOverModalProps {
  isOpen: boolean;
  stageConfig: StageConfig;
  score: number;
  onRetryStage: () => void;
  onRestartFromBeginning: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  stageConfig,
  score,
  onRetryStage,
  onRestartFromBeginning,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl shadow-[0_0_40px_rgba(244,63,94,0.25)] p-6 text-center text-slate-100 flex flex-col items-center gap-4">
        {/* Biểu tượng Game Over */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-500/30">
          <Skull className="w-9 h-9 text-rose-400 stroke-[2.5]" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-200 font-arcade">
            HẾT GIỜ RỒI!
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Thời gian cho {stageConfig.name} đã kết thúc.
          </p>
        </div>

        {/* Thống kê điểm */}
        <div className="w-full p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-400">
            <span>Màn dừng chân:</span>
            <span className="font-bold text-slate-200">Màn {stageConfig.stage} / 8</span>
          </div>
          <div className="border-t border-slate-800/80 pt-2 flex justify-between items-center">
            <span className="text-slate-300 font-bold">Tổng điểm đạt được:</span>
            <span className="text-base font-extrabold text-amber-400">
              {score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="w-full space-y-2 pt-2">
          <button
            type="button"
            onClick={onRetryStage}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thử lại màn này</span>
          </button>
          <button
            type="button"
            onClick={onRestartFromBeginning}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Chơi lại từ Màn 1</span>
          </button>
        </div>
      </div>
    </div>
  );
};
