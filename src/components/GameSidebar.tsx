import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Shuffle,
  Volume2,
  VolumeX,
  RotateCcw,
  Images,
  Flame,
  Clock,
  Trophy,
  Maximize,
  Minimize,
  Settings,
  Heart,
  Music,
  Sliders,
  Bird,
  Home,
} from 'lucide-react';
import { StageConfig } from '../types/game';

interface GameSidebarProps {
  stageConfig: StageConfig;
  score: number;
  timeLeft: number;
  totalTime: number;
  hintsLeft: number;
  shufflesLeft: number;
  soundEnabled: boolean;
  bgmEnabled: boolean;
  bgmVolume: number;
  remainingPairs: number;
  combo: number;
  isFullscreen: boolean;
  onHint: () => void;
  onShuffle: () => void;
  onToggleSound: () => void;
  onToggleBgm: () => void;
  onChangeBgmVolume: (vol: number) => void;
  onRestart: () => void;
  onOpenPhotos: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  onToggleFullscreen: () => void;
  onBackToLobby: () => void;
}

export const GameSidebar: React.FC<GameSidebarProps> = ({
  stageConfig,
  score,
  timeLeft,
  totalTime,
  hintsLeft,
  shufflesLeft,
  soundEnabled,
  bgmEnabled,
  bgmVolume,
  remainingPairs,
  combo,
  isFullscreen,
  onHint,
  onShuffle,
  onToggleSound,
  onToggleBgm,
  onChangeBgmVolume,
  onRestart,
  onOpenPhotos,
  onOpenLeaderboard,
  onOpenSettings,
  onToggleFullscreen,
  onBackToLobby,
}) => {
  const [showVolumePop, setShowVolumePop] = useState(false);
  const [popPos, setPopPos] = useState<{ top: number; left: number } | null>(null);
  const volumeBtnRef = useRef<HTMLButtonElement | null>(null);
  const volumePopRef = useRef<HTMLDivElement | null>(null);

  // Mở/đóng popover âm lượng ở vị trí bên phải ngoài viền sidebar
  const handleToggleVolumePop = () => {
    if (!showVolumePop && volumeBtnRef.current) {
      const rect = volumeBtnRef.current.getBoundingClientRect();
      setPopPos({
        top: Math.max(12, rect.top + rect.height / 2 - 88),
        left: rect.right + 12,
      });
    }
    setShowVolumePop(!showVolumePop);
  };

  // Đóng popover âm lượng khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        volumePopRef.current &&
        !volumePopRef.current.contains(event.target as Node) &&
        volumeBtnRef.current &&
        !volumeBtnRef.current.contains(event.target as Node)
      ) {
        setShowVolumePop(false);
      }
    };
    if (showVolumePop) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolumePop]);

  const timePercent = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Rút gọn điểm số: nghìn -> k, triệu -> M, tỉ -> B
  const formatScore = (num: number): string => {
    if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    }
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return num.toLocaleString();
  };

  return (
    <aside className="w-[116px] shrink-0 h-screen bg-slate-900/98 border-r border-slate-800 py-2 px-1.5 flex flex-col justify-between items-center select-none z-40 text-slate-200">
      {/* 1. Tiêu đề: 2 dòng Phuong / kemon ❤️ nằm gọn trong viền, to rõ */}
      <div className="w-full py-2 px-1 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col items-center justify-center text-center gap-1 shadow-sm">
        <span className="text-[14px] font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-300 to-amber-200 font-arcade leading-normal inline-block">
          Phuong
        </span>
        <span className="text-[11.5px] font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-amber-300 font-arcade leading-normal inline-flex items-center justify-center gap-1">
          kemon <Heart className="w-3 h-3 fill-rose-500 text-rose-500 shrink-0 drop-shadow" />
        </span>
      </div>

      {/* 2. Màn chơi: to rõ, không mô tả thừa */}
      <div className="w-full py-1 px-1 bg-slate-950/70 rounded-xl border border-slate-800/80 text-center">
        <div className="text-[11px] font-black text-rose-400">
          Màn {stageConfig.stage}
        </div>
        <div className="text-xs font-black text-amber-300 leading-tight break-words">
          {stageConfig.name}
        </div>
      </div>

      {/* 3. Thời gian & Số cặp còn lại */}
      <div className="w-full py-1 px-1.5 bg-slate-950/80 rounded-xl border border-slate-800 text-center space-y-0.5">
        <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-300">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{formatTime(timeLeft)}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              timePercent > 45
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : timePercent > 20
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                : 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse'
            }`}
            style={{ width: `${timePercent}%` }}
          />
        </div>
        <div className="text-[10px] text-slate-400 leading-tight">
          <strong className="text-white font-extrabold">{remainingPairs}</strong> cặp
        </div>
      </div>

      {/* 4. Điểm số to rõ (rút gọn k, M, B) & Combo */}
      <div className="w-full py-1 px-1 bg-slate-950/70 rounded-xl border border-slate-800/80 text-center">
        <div className="text-[9px] uppercase font-bold text-slate-400">Điểm</div>
        <div className="font-black text-amber-300 text-sm leading-tight tracking-wide">
          {formatScore(score)}
        </div>
        {combo > 1 && (
          <div className="text-[9px] text-orange-400 font-bold flex items-center justify-center gap-0.5 animate-bounce">
            <Flame className="w-2.5 h-2.5" />
            <span>x{combo}!</span>
          </div>
        )}
      </div>

      {/* 5. Nút Gợi ý (nút vuông to có badge số lượt) */}
      <div className="w-full flex justify-center">
        <button
          type="button"
          onClick={onHint}
          disabled={hintsLeft <= 0}
          title={`Gợi ý (còn ${hintsLeft} lần)`}
          className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
            hintsLeft > 0
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 shadow-sm'
              : 'bg-slate-950/40 border-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] flex items-center justify-center shadow">
            {hintsLeft}
          </span>
        </button>
      </div>

      {/* 6. Nút Đổi vị trí (nút vuông to có badge số lượt) */}
      <div className="w-full flex justify-center">
        <button
          type="button"
          onClick={onShuffle}
          disabled={shufflesLeft <= 0}
          title={`Đổi vị trí (còn ${shufflesLeft} lần)`}
          className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
            shufflesLeft > 0
              ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 shadow-sm'
              : 'bg-slate-950/40 border-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Shuffle className="w-5 h-5" />
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-indigo-500 text-slate-950 font-black text-[9px] flex items-center justify-center shadow">
            {shufflesLeft}
          </span>
        </button>
      </div>

      {/* 7. Nút Bật/tắt Nhạc nền (hàng riêng, nút vuông) */}
      <div className="w-full flex justify-center">
        <button
          type="button"
          onClick={onToggleBgm}
          title={bgmEnabled ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
            bgmEnabled
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-sm shadow-rose-500/20'
              : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}
        >
          <Music className="w-5 h-5" />
        </button>
      </div>

      {/* 8. Nút Chỉnh âm lượng (hàng riêng, nút vuông, popover bay ra bên phải ngoài viền) */}
      <div className="w-full flex justify-center">
        <button
          ref={volumeBtnRef}
          type="button"
          onClick={handleToggleVolumePop}
          title="Âm lượng nhạc nền"
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
            showVolumePop
              ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-400/20'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <Sliders className="w-5 h-5" />
        </button>
      </div>

      {/* Popover trượt dọc ngoài viền phải, không bị che khuất */}
      {showVolumePop && popPos && (
        <div
          ref={volumePopRef}
          style={{ top: `${popPos.top}px`, left: `${popPos.left}px` }}
          className="fixed w-10 h-44 p-2 bg-slate-900/95 border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col items-center justify-between z-50 backdrop-blur-md animate-fadeIn"
        >
          <span className="text-[9px] font-black text-rose-400 select-none">MAX</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={bgmVolume}
            onChange={(e) => onChangeBgmVolume(Number(e.target.value))}
            className="h-28 w-1.5 accent-rose-500 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
          />
          <span className="text-[9px] font-black text-slate-500 select-none">0</span>
        </div>
      )}

      {/* 9. Nút Tiếng hiệu ứng (hàng riêng, nút vuông) */}
      <div className="w-full flex justify-center">
        <button
          type="button"
          onClick={onToggleSound}
          title={soundEnabled ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
            soundEnabled
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/20'
              : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* 10. Nút Bảng kỷ lục (hàng riêng, nút vuông) */}
      <div className="w-full flex justify-center">
        <button
          type="button"
          onClick={onOpenLeaderboard}
          title="Bảng kỷ lục"
          className="w-10 h-10 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-yellow-400 flex items-center justify-center cursor-pointer transition-colors shadow-sm"
        >
          <Trophy className="w-5 h-5" />
        </button>
      </div>

      {/* 11. Nút Nạp 36 ảnh (hàng riêng, nút vuông) */}
      <div className="w-full flex justify-center">
        <button
          type="button"
          onClick={onOpenPhotos}
          title="Nạp & quản lý 36 ảnh"
          className="w-10 h-10 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 flex items-center justify-center cursor-pointer transition-colors shadow-sm"
        >
          <Images className="w-5 h-5" />
        </button>
      </div>

      {/* 12. Nút Cài đặt (hàng riêng, nút vuông) */}
      <div className="w-full flex justify-center">
        <button
          type="button"
          onClick={onOpenSettings}
          title="Cài đặt game"
          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 flex items-center justify-center cursor-pointer transition-colors shadow-sm"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* 13. Nút Về Menu chính (hàng riêng, nút vuông) */}
      <div className="w-full flex justify-center">
        <button
          type="button"
          onClick={onBackToLobby}
          title="Về Menu chính (Đổi game)"
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500/25 to-pink-500/25 hover:from-rose-500/40 hover:to-pink-500/40 border border-rose-400/40 text-rose-300 flex items-center justify-center cursor-pointer transition-colors shadow-sm"
        >
          <Home className="w-5 h-5 text-rose-300" />
        </button>
      </div>

      {/* 14. Nút Toàn màn hình F11 (hàng riêng, nút vuông) */}
      <div className="w-full flex justify-center">
        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Thu nhỏ màn hình' : 'Toàn màn hình'}
          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 flex items-center justify-center cursor-pointer transition-colors shadow-sm"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>

      {/* 15. Nút Chơi lại màn này (hàng riêng, nút vuông) */}
      <div className="w-full flex justify-center">
        <button
          type="button"
          onClick={onRestart}
          title="Chơi lại màn này"
          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors shadow-sm"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};
