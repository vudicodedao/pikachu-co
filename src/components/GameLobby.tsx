import React, { useState, useEffect } from 'react';
import { Play, Trophy, Sparkles, Heart, Maximize, Minimize, Flame, Zap, Lock } from 'lucide-react';
import { BirdAvatar } from './BirdAvatar';
import { SuperheroAvatar } from './SuperheroAvatar';
import { haptics } from '../utils/haptics';

interface GameLobbyProps {
  onSelectPikachu: () => void;
  onSelectFlappy: () => void;
  onSelectMemory: () => void;
  onSelectCatcher: () => void;
  onLock?: () => void;
  pikachuBestScore?: number;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  onSelectPikachu,
  onSelectFlappy,
  onSelectMemory,
  onSelectCatcher,
  onLock,
  pikachuBestScore = 0,
}) => {
  const [flappyBest, setFlappyBest] = useState(0);
  const [memoryBest, setMemoryBest] = useState(0);
  const [catcherBest, setCatcherBest] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const savedFlappy = Number(localStorage.getItem('flappy_phuong_best') || 0);
    setFlappyBest(savedFlappy);

    const savedMemory = Number(localStorage.getItem('phuong_memory_best') || 0);
    setMemoryBest(savedMemory);

    const savedCatcher = Number(localStorage.getItem('phuong_catcher_best') || 0);
    setCatcherBest(savedCatcher);

    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    haptics.tap();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="w-screen min-h-dvh h-dvh bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-3 sm:p-6 select-none relative overflow-y-auto overscroll-none">
      {/* Nền hiệu ứng ánh sáng gradient lung linh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(244,63,94,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_120%,rgba(56,189,248,0.1),rgba(255,255,255,0))] pointer-events-none" />

      {/* Nút Khóa & Toàn màn hình ở góc trên phải */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-2">
        {onLock && (
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              onLock();
            }}
            className="p-2 sm:p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 text-rose-300 hover:text-rose-200 shadow-xl transition-all cursor-pointer backdrop-blur-md flex items-center gap-1.5 text-xs font-bold active:scale-95"
            title="Khóa bảo mật trang web"
          >
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Khóa</span>
          </button>
        )}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2 sm:p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-sky-300 shadow-xl transition-all cursor-pointer backdrop-blur-md flex items-center gap-1.5 text-xs font-bold active:scale-95"
          title="Toàn màn hình"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
        </button>
      </div>

      {/* HEADER: LOGO CHÚ CHIM & TÊN WEB MY BABY PHUONG */}
      <div className="relative z-10 flex flex-col items-center text-center mt-2 sm:mt-4 space-y-2">
        {/* LOGO CHÍNH: Chú chim đầu khuôn mặt phồng má đặc trưng */}
        <div className="p-1.5 rounded-3xl bg-slate-900/80 border border-slate-800/80 shadow-2xl shadow-rose-500/10 backdrop-blur-md">
          <BirdAvatar size={76} />
        </div>

        <div>
          <h1 className="text-2xl sm:text-4xl font-black font-arcade tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-400 to-pink-400 drop-shadow-[0_2px_15px_rgba(244,63,94,0.3)]">
            My baby Phuong
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-400 mt-0.5 flex items-center justify-center gap-1.5">
            <span>Khu Game Arcade Dành Riêng Cho Em Bé Iu</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 inline animate-pulse" />
          </p>
        </div>
      </div>

      {/* DANH SÁCH 4 GAME RIÊNG BIỆT (4 GAME CARDS) */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full max-w-7xl my-auto py-3">
        {/* GAME 1: PHUONGKEMON (PIKACHU) */}
        <div className="group relative rounded-3xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-2 border-slate-800 hover:border-rose-500/60 p-5 shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-extrabold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Nối Hình</span>
              </span>
              <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-yellow-400" />
                <span>Kỷ lục: {pikachuBestScore > 0 ? pikachuBestScore.toLocaleString() : 0}</span>
              </span>
            </div>

            <div className="flex items-center gap-3.5 mb-2.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center shadow-lg shadow-rose-500/30 shrink-0">
                <Heart className="w-7 h-7 text-slate-950 fill-slate-950" />
              </div>
              <div>
                <h2 className="text-lg font-black font-arcade text-rose-300 group-hover:text-rose-200 transition-colors">
                  Phuongkemon
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Nối các cặp ảnh kỷ niệm qua 9 màn biến đổi trọng lực.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center my-2 text-xs">
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase">Độ dài</div>
                <div className="font-extrabold text-amber-300 text-[11px]">9 Màn</div>
              </div>
              <div className="border-x border-slate-800">
                <div className="text-[9px] text-slate-500 font-bold uppercase">Thời gian</div>
                <div className="font-extrabold text-pink-300 text-[11px]">10 Phút</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase">Ảnh nạp</div>
                <div className="font-extrabold text-emerald-400 text-[11px]">36 Ảnh</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              haptics.tap();
              onSelectPikachu();
            }}
            className="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 transition-all cursor-pointer group-hover:scale-[1.02] active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>CHƠI PIKACHU NGAY</span>
          </button>
        </div>

        {/* GAME 2: FLAPPY PHUONG (FLAPPY BIRD) */}
        <div className="group relative rounded-3xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-2 border-slate-800 hover:border-amber-400/60 p-5 shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-400/10 rounded-full blur-2xl group-hover:bg-amber-400/20 transition-all pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-extrabold flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Bay Né Cọc</span>
              </span>
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-yellow-400" />
                <span>Kỷ lục: {flappyBest}</span>
              </span>
            </div>

            <div className="flex items-center gap-3.5 mb-2.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-400/30 shrink-0 p-1">
                <BirdAvatar size={48} animate={false} />
              </div>
              <div>
                <h2 className="text-lg font-black font-arcade text-amber-300 group-hover:text-amber-200 transition-colors">
                  Flappy Phuong
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Giữ nhịp bay né ống nước với đầu phồng má ngộ nghĩnh!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center my-2 text-xs">
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase">Cách chơi</div>
                <div className="font-extrabold text-sky-300 text-[11px]">Né Cọc</div>
              </div>
              <div className="border-x border-slate-800">
                <div className="text-[9px] text-slate-500 font-bold uppercase">Điều khiển</div>
                <div className="font-extrabold text-emerald-300 text-[11px]">Phím / Chạm</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase">Danh hiệu</div>
                <div className="font-extrabold text-amber-400 text-[11px]">4 Huy Chương</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              haptics.tap();
              onSelectFlappy();
            }}
            className="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 transition-all cursor-pointer group-hover:scale-[1.02] active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>CHƠI FLAPPY BIRD NGAY</span>
          </button>
        </div>

        {/* GAME 3: PHUONG MEMORY (LẬT BÀI 8 MÀN 10 PHÚT) */}
        <div className="group relative rounded-3xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-2 border-slate-800 hover:border-violet-500/60 p-5 shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] font-extrabold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Lật Thẻ Bài</span>
              </span>
              <span className="text-[11px] font-bold text-violet-300 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-yellow-400" />
                <span>Kỷ lục: {memoryBest.toLocaleString()}</span>
              </span>
            </div>

            <div className="flex items-center gap-3.5 mb-2.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-500 to-purple-400 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
                <Sparkles className="w-7 h-7 text-slate-950" />
              </div>
              <div>
                <h2 className="text-lg font-black font-arcade text-violet-300 group-hover:text-violet-200 transition-colors">
                  Phuong Memory
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Ghi nhớ và tìm các cặp ảnh giống nhau qua 8 màn thử thách.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center my-2 text-xs">
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase">Độ dài</div>
                <div className="font-extrabold text-amber-300 text-[11px]">8 Màn</div>
              </div>
              <div className="border-x border-slate-800">
                <div className="text-[9px] text-slate-500 font-bold uppercase">Thời gian</div>
                <div className="font-extrabold text-violet-300 text-[11px]">10 Phút</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase">Số lá</div>
                <div className="font-extrabold text-emerald-400 text-[11px]">4 → 72 Lá</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              haptics.tap();
              onSelectMemory();
            }}
            className="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30 transition-all cursor-pointer group-hover:scale-[1.02] active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>CHƠI LẬT BÀI NGAY</span>
          </button>
        </div>

        {/* GAME 4: PHUONG CATCHER (SIÊU NHÂN HỨNG BẠN GÁI & TIM) */}
        <div className="group relative rounded-3xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-2 border-slate-800 hover:border-sky-500/60 p-5 shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-all pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-extrabold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Hứng Em Bé</span>
              </span>
              <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-yellow-400" />
                <span>Kỷ lục: {catcherBest.toLocaleString()} HP</span>
              </span>
            </div>

            <div className="flex items-center gap-3.5 mb-2.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30 shrink-0 p-1">
                <SuperheroAvatar size={48} animate={false} />
              </div>
              <div>
                <h2 className="text-lg font-black font-arcade text-sky-300 group-hover:text-sky-200 transition-colors">
                  Phuong Catcher
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Dùng phím ⬅️ ➡️ hoặc trượt ngón tay hứng ảnh bạn gái và tim!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center my-2 text-xs">
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase">Điều khiển</div>
                <div className="font-extrabold text-amber-300 text-[11px]">Phím / Trượt tay</div>
              </div>
              <div className="border-x border-slate-800">
                <div className="text-[9px] text-slate-500 font-bold uppercase">Khởi điểm</div>
                <div className="font-extrabold text-emerald-400 text-[11px]">100 HP</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase">Sinh mạng</div>
                <div className="font-extrabold text-rose-400 text-[11px]">3 Tim</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              haptics.tap();
              onSelectCatcher();
            }}
            className="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 transition-all cursor-pointer group-hover:scale-[1.02] active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>CHƠI SIÊU NHÂN NGAY</span>
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <div className="relative z-10 text-center text-xs font-semibold text-slate-500 pb-2 flex items-center justify-center gap-1">
        <span>© 2026 My baby Phượng • Phiên bản Arcade đặc biệt</span>
      </div>
    </div>
  );
};
