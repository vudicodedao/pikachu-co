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
  X,
} from 'lucide-react';
import { StageConfig } from '../types/game';

interface GameHeaderProps {
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
}

export const GameHeader: React.FC<GameHeaderProps> = ({
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
}) => {
  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
  const audioMenuRef = useRef<HTMLDivElement | null>(null);

  // Đóng popover âm thanh khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (audioMenuRef.current && !audioMenuRef.current.contains(event.target as Node)) {
        setIsAudioMenuOpen(false);
      }
    };
    if (isAudioMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAudioMenuOpen]);

  const timePercent = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-[1180px] mx-auto mb-3 space-y-2.5">
      {/* Thanh trên cùng: Tiêu đề "Phuongkemon ❤️" + Thao tác hệ thống */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-300 flex items-center justify-center shadow-lg shadow-rose-500/30">
            <Heart className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-300 to-amber-300 flex items-center gap-2 font-arcade">
              <span>Phuongkemon</span>
              <span className="text-rose-500 animate-pulse text-sm">❤️</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <span className="text-rose-300/90">{stageConfig.name}</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span className="text-amber-400/90">{stageConfig.description}</span>
            </p>
          </div>
        </div>

        {/* Các nút công cụ */}
        <div className="flex items-center gap-2">
          {/* Nút Bảng xếp hạng */}
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all cursor-pointer hover:shadow-lg hover:shadow-amber-500/20"
            title="Xem bảng xếp hạng điểm cao"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Kỷ lục</span>
          </button>

          {/* Nút Quản lý ảnh */}
          <button
            type="button"
            onClick={onOpenPhotos}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-all cursor-pointer hover:shadow-lg hover:shadow-rose-500/20"
            title="Quản lý và nạp 36 ảnh"
          >
            <Images className="w-4 h-4" />
            <span>Nạp ảnh</span>
          </button>

          {/* Nút Cài đặt */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Cài đặt thời gian, gợi ý, xáo bài"
          >
            <Settings className="w-4 h-4 text-amber-400" />
          </button>

          {/* Nút Âm lượng & Nhạc nền kèm Popover sổ ra ngay bên dưới */}
          <div className="relative" ref={audioMenuRef}>
            <button
              type="button"
              onClick={() => setIsAudioMenuOpen(!isAudioMenuOpen)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                bgmEnabled
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-300 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400'
              }`}
              title="Click để chỉnh âm lượng nhạc nền & hiệu ứng"
            >
              <Music className="w-4 h-4" />
              <span className="text-[10px] font-bold">
                {bgmEnabled ? `${Math.round(bgmVolume * 100)}%` : 'Tắt'}
              </span>
            </button>

            {/* Popover chỉnh âm thanh ngay dưới nút, không che màn chơi */}
            {isAudioMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 p-3.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-md z-50 animate-fadeIn space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
                  <span className="flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-rose-400" />
                    Chỉnh âm lượng
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAudioMenuOpen(false)}
                    className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Nhạc nền (BGM) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <button
                      type="button"
                      onClick={onToggleBgm}
                      className="flex items-center gap-1.5 hover:text-rose-300 cursor-pointer font-medium"
                    >
                      <span className={`w-2 h-2 rounded-full ${bgmEnabled ? 'bg-rose-400 animate-pulse' : 'bg-slate-600'}`} />
                      <span>Nhạc nền ({bgmEnabled ? 'Bật' : 'Tắt'})</span>
                    </button>
                    <span className="font-extrabold text-rose-300 text-xs">
                      {bgmEnabled ? `${Math.round(bgmVolume * 100)}%` : 'Đã tắt'}
                    </span>
                  </div>
                  {bgmEnabled && (
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={bgmVolume}
                      onChange={(e) => onChangeBgmVolume(Number(e.target.value))}
                      className="w-full accent-rose-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  )}
                </div>

                {/* Âm thanh hiệu ứng (SFX) */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1.5">
                    {soundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>Tiếng hiệu ứng</span>
                  </span>
                  <button
                    type="button"
                    onClick={onToggleSound}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      soundEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {soundEnabled ? 'Bật' : 'Tắt'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Nút Toàn màn hình F11 */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            title={isFullscreen ? 'Thu nhỏ màn hình (Thoát F11)' : 'Phóng toàn màn hình (F11)'}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 text-sky-400" />
            ) : (
              <Maximize className="w-4 h-4 text-sky-400" />
            )}
          </button>

          {/* Nút Chơi lại màn hiện tại */}
          <button
            type="button"
            onClick={onRestart}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Chơi lại màn này"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thanh giữa: Thông số thời gian (Countdown Bar theo chuẩn Pikachu cổ điển) */}
      <div className="px-4 py-2 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Clock className="w-3.5 h-3.5" />
            <span>Thời gian còn lại: {formatTime(timeLeft)}</span>
          </div>
          <div className="flex items-center gap-4">
            {combo > 1 && (
              <div className="flex items-center gap-1 text-orange-400 font-extrabold animate-bounce">
                <Flame className="w-3.5 h-3.5" />
                <span>COMBO x{combo}!</span>
              </div>
            )}
            <div className="text-slate-400">
              Còn lại: <strong className="text-white">{remainingPairs}</strong> cặp
            </div>
          </div>
        </div>

        {/* Thanh tụt thời gian */}
        <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              timePercent > 45
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                : timePercent > 20
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                : 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.7)]'
            }`}
            style={{ width: `${timePercent}%` }}
          />
        </div>
      </div>

      {/* Thanh dưới: Điểm số + Màn + Quyền trợ giúp */}
      <div className="grid grid-cols-4 gap-2.5 text-xs">
        {/* Điểm số */}
        <div className="px-3.5 py-2 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>Điểm:</span>
          </div>
          <span className="font-extrabold text-amber-400 text-sm tracking-wide">
            {score.toLocaleString()}
          </span>
        </div>

        {/* Màn chơi (hiển thị / 9) */}
        <div className="px-3.5 py-2 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Màn:</span>
          <span className="font-bold text-sky-400 text-sm">
            {stageConfig.stage} / 9
          </span>
        </div>

        {/* Nút Gợi ý */}
        <button
          type="button"
          onClick={onHint}
          disabled={hintsLeft <= 0}
          className={`px-3.5 py-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
            hintsLeft > 0
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/20'
              : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold">Gợi ý</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-bold text-xs border border-emerald-500/30">
            {hintsLeft}
          </span>
        </button>

        {/* Nút Đổi vị trí (Shuffle) */}
        <button
          type="button"
          onClick={onShuffle}
          disabled={shufflesLeft <= 0}
          className={`px-3.5 py-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
            shufflesLeft > 0
              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/20'
              : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Shuffle className="w-4 h-4" />
            <span className="font-semibold">Đổi vị trí</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 font-bold text-xs border border-indigo-500/30">
            {shufflesLeft}
          </span>
        </button>
      </div>
    </div>
  );
};
