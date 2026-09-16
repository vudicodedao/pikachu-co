import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Clock,
  Trophy,
  Flame,
  Volume2,
  VolumeX,
  Music,
  Sliders,
  RotateCcw,
  Maximize,
  Minimize,
  Sparkles,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { memorySound } from '../core/memorySound';
import { getTilePhotoUrl, getAllCustomPhotos } from '../utils/photoStorage';
import { BirdAvatar } from './BirdAvatar';
import { LeaderboardModal } from './LeaderboardModal';
import {
  getLeaderboard,
  saveLeaderboardEntry,
  clearLeaderboard,
  MEMORY_LEADERBOARD_KEY,
} from '../utils/leaderboard';

interface MemoryGameProps {
  onBackToLobby: () => void;
}

interface MemoryStage {
  stage: number;
  cols: number;
  rows: number;
  totalCards: number;
  pairsCount: number;
  name: string;
}

// Cấu hình 8 màn thử thách tăng dần trong 10 phút (từ 4 lá đến 72 lá max)
const MEMORY_STAGES: MemoryStage[] = [
  { stage: 1, cols: 2, rows: 2, totalCards: 4, pairsCount: 2, name: 'Khởi Động (4 lá)' },
  { stage: 2, cols: 4, rows: 2, totalCards: 8, pairsCount: 4, name: 'Làm Quen (8 lá)' },
  { stage: 3, cols: 4, rows: 3, totalCards: 12, pairsCount: 6, name: 'Thử Thách (12 lá)' },
  { stage: 4, cols: 4, rows: 4, totalCards: 16, pairsCount: 8, name: 'Tập Trung (16 lá)' },
  { stage: 5, cols: 6, rows: 4, totalCards: 24, pairsCount: 12, name: 'Tăng Tốc (24 lá)' },
  { stage: 6, cols: 6, rows: 6, totalCards: 36, pairsCount: 18, name: 'Bứt Phá (36 lá)' },
  { stage: 7, cols: 8, rows: 6, totalCards: 48, pairsCount: 24, name: 'Siêu Trí Nhớ (48 lá)' },
  { stage: 8, cols: 12, rows: 6, totalCards: 72, pairsCount: 36, name: 'Chung Kết Cực Hạn (72 lá - Full 36 ảnh)' },
];

const TOTAL_GAME_TIME = 600; // 10 phút cố định (600 giây)

interface CardItem {
  uniqueId: string;
  photoId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({ onBackToLobby }) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const stage = MEMORY_STAGES[currentStageIdx];

  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]); // indexes of 2 flipped cards
  const [isProcessing, setIsProcessing] = useState(false);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [totalPairsMatched, setTotalPairsMatched] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_GAME_TIME);
  const [gameState, setGameState] = useState<'playing' | 'stage_cleared' | 'game_over' | 'victory'>('playing');

  const [bestScore, setBestScore] = useState(() => {
    return Number(localStorage.getItem('phuong_memory_best') || 0);
  });
  const [isNewBest, setIsNewBest] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState(() => getLeaderboard(MEMORY_LEADERBOARD_KEY));
  const sessionStartTimeRef = useRef(Date.now());

  const recordLeaderboard = useCallback((finalScore: number, finalStage: number) => {
    const timeSpent = Math.max(1, Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
    const updated = saveLeaderboardEntry(
      {
        score: finalScore,
        stageReached: finalStage,
        timeSpentSeconds: timeSpent,
      },
      MEMORY_LEADERBOARD_KEY
    );
    setLeaderboard(updated);
  }, []);

  // Âm thanh
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [bgmVolume, setBgmVolume] = useState(0.45);
  const [showVolumePop, setShowVolumePop] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [customPhotos, setCustomPhotos] = useState<Record<number, string>>({});
  const volumeBtnRef = useRef<HTMLButtonElement | null>(null);
  const volumePopRef = useRef<HTMLDivElement | null>(null);

  // Load kho ảnh tùy chỉnh
  useEffect(() => {
    getAllCustomPhotos().then((photos) => {
      setCustomPhotos(photos);
    });

    // Bật nhạc nền game
    memorySound.setBgmVolume(bgmVolume);
    memorySound.setBgmEnabled(bgmEnabled);
    memorySound.sfxEnabled = soundEnabled;

    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      memorySound.stopBgm();
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  // Xử lý bật/tắt popover âm lượng khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        volumePopRef.current &&
        !volumePopRef.current.contains(e.target as Node) &&
        volumeBtnRef.current &&
        !volumeBtnRef.current.contains(e.target as Node)
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

  // Tạo bộ thẻ bài ngẫu nhiên cho màn chơi hiện tại
  const initStageCards = useCallback((stageConfig: MemoryStage) => {
    // 1. Chọn ngẫu nhiên `pairsCount` ảnh từ 1..36
    const allPhotoIds = Array.from({ length: 36 }, (_, idx) => idx + 1);
    // Xáo trộn để chọn
    for (let i = allPhotoIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPhotoIds[i], allPhotoIds[j]] = [allPhotoIds[j], allPhotoIds[i]];
    }
    const chosenPhotos = allPhotoIds.slice(0, stageConfig.pairsCount);

    // 2. Nhân đôi thành các cặp
    const cardPairs: CardItem[] = [];
    chosenPhotos.forEach((photoId, idx) => {
      cardPairs.push({
        uniqueId: `${stageConfig.stage}-${photoId}-A-${idx}`,
        photoId,
        isFlipped: false,
        isMatched: false,
      });
      cardPairs.push({
        uniqueId: `${stageConfig.stage}-${photoId}-B-${idx}`,
        photoId,
        isFlipped: false,
        isMatched: false,
      });
    });

    // 3. Xáo trộn ngẫu nhiên vị trí các lá bài trên bàn cờ
    for (let i = cardPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }

    setCards(cardPairs);
    setSelectedCards([]);
    setIsProcessing(false);
  }, []);

  // Khởi động màn chơi
  useEffect(() => {
    initStageCards(stage);
  }, [currentStageIdx, initStageCards]);

  // Đếm ngược 10 phút cố định toàn game
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('game_over');
          memorySound.playGameOver();
          recordLeaderboard(score, stage.stage);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Cập nhật kỷ lục khi điểm tăng
  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('phuong_memory_best', score.toString());
      setIsNewBest(true);
    }
  }, [score, bestScore]);

  // Xử lý khi người chơi bấm lật 1 lá bài
  const handleCardClick = (cardIndex: number) => {
    if (isProcessing || gameState !== 'playing') return;

    const clickedCard = cards[cardIndex];
    if (clickedCard.isFlipped || clickedCard.isMatched) return;

    // Lật lá bài
    memorySound.playFlip();
    const newCards = [...cards];
    newCards[cardIndex] = { ...clickedCard, isFlipped: true };
    setCards(newCards);

    const newSelected = [...selectedCards, cardIndex];
    setSelectedCards(newSelected);

    // Nếu đã lật đủ 2 lá bài -> So sánh
    if (newSelected.length === 2) {
      setIsProcessing(true);
      const [firstIdx, secondIdx] = newSelected;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.photoId === secondCard.photoId) {
        // KHỚP CẶP THÀNH CÔNG!
        setTimeout(() => {
          memorySound.playMatch();
          const matchedCards = [...newCards];
          matchedCards[firstIdx] = { ...firstCard, isMatched: true };
          matchedCards[secondIdx] = { ...secondCard, isMatched: true };
          setCards(matchedCards);
          setSelectedCards([]);
          setIsProcessing(false);

          // Tính điểm: 100 x Màn + Thưởng combo
          const newCombo = combo + 1;
          setCombo(newCombo);
          const comboBonus = Math.floor((newCombo - 1) * 30 * stage.stage);
          const earned = 100 * stage.stage + comboBonus;
          setScore((prev) => prev + earned);
          setTotalPairsMatched((prev) => prev + 1);

          // Kiểm tra xem đã hoàn thành toàn bộ bàn cờ màn này chưa
          const remainingUnmatched = matchedCards.filter((c) => !c.isMatched).length;
          if (remainingUnmatched === 0) {
            // Màn chơi hoàn thành!
            memorySound.playStageClear();
            confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });

            if (currentStageIdx === MEMORY_STAGES.length - 1) {
              // Phá đảo màn 8 (Chung kết 72 lá)!
              setGameState('victory');
              recordLeaderboard(score + earned, stage.stage);
            } else {
              setGameState('stage_cleared');
            }
          }
        }, 320);
      } else {
        // LẬT SAI: Úp bài lại sau 650ms
        setTimeout(() => {
          memorySound.playMismatch();
          const unFlippedCards = [...newCards];
          unFlippedCards[firstIdx] = { ...firstCard, isFlipped: false };
          unFlippedCards[secondIdx] = { ...secondCard, isFlipped: false };
          setCards(unFlippedCards);
          setSelectedCards([]);
          setIsProcessing(false);
          setCombo(0);
          setScore((prev) => Math.max(0, prev - 10)); // Trừ 10 điểm phạt
        }, 650);
      }
    }
  };

  // Sang màn kế tiếp
  const handleNextStage = () => {
    if (currentStageIdx < MEMORY_STAGES.length - 1) {
      setCurrentStageIdx((prev) => prev + 1);
      setGameState('playing');
    }
  };

  // Chơi lại từ đầu (Reset 10 phút, Màn 1, Điểm 0)
  const handleRestartFullGame = () => {
    sessionStartTimeRef.current = Date.now();
    setCurrentStageIdx(0);
    setTimeLeft(TOTAL_GAME_TIME);
    setScore(0);
    setCombo(0);
    setTotalPairsMatched(0);
    setIsNewBest(false);
    setGameState('playing');
    initStageCards(MEMORY_STAGES[0]);
  };

  // Định dạng thời gian MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const timePercent = (timeLeft / TOTAL_GAME_TIME) * 100;
  const matchedPairsInStage = cards.filter((c) => c.isMatched).length / 2;

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col justify-between select-none overflow-hidden relative">
      {/* 1. THANH HEADER ĐIỀU KHIỂN TRÊN CÙNG */}
      <header className="shrink-0 h-16 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-30 backdrop-blur-md">
        {/* Nút Về Menu chính */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToLobby}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Menu chính</span>
          </button>

          {/* Thông tin Màn chơi */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-black font-arcade">
              MÀN {stage.stage}/8
            </span>
            <span className="hidden md:inline text-xs font-bold text-slate-300 truncate max-w-[200px]">
              {stage.name}
            </span>
          </div>
        </div>

        {/* Đồng hồ đếm ngược 10 phút & Tiến trình */}
        <div className="flex flex-col items-center justify-center px-2">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black font-arcade tracking-wider">
            <Clock className={`w-4 h-4 ${timeLeft < 60 ? 'text-red-500 animate-spin' : 'text-amber-300'}`} />
            <span className={timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-amber-300'}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="w-32 sm:w-48 h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1 border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                timePercent > 40
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : timePercent > 15
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse'
              }`}
              style={{ width: `${timePercent}%` }}
            />
          </div>
        </div>

        {/* Điểm số & Bộ điều khiển Âm thanh */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Điểm số */}
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Điểm</div>
              <div className="text-sm sm:text-base font-black text-amber-300 font-arcade">
                {score.toLocaleString()}
              </div>
            </div>
            {combo > 1 && (
              <div className="text-xs text-orange-400 font-bold flex items-center gap-0.5 animate-bounce">
                <Flame className="w-3.5 h-3.5" />
                <span>x{combo}!</span>
              </div>
            )}
          </div>

          {/* Cụm chỉnh âm thanh độc lập */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 relative">
            {/* Nhạc nền BGM */}
            <button
              type="button"
              onClick={() => {
                const next = !bgmEnabled;
                setBgmEnabled(next);
                memorySound.setBgmEnabled(next);
              }}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                bgmEnabled
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title={bgmEnabled ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
            >
              <Music className="w-3.5 h-3.5" />
            </button>

            {/* Nút Pop trượt âm lượng BGM */}
            <button
              ref={volumeBtnRef}
              type="button"
              onClick={() => setShowVolumePop(!showVolumePop)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                showVolumePop
                  ? 'bg-amber-400 text-slate-950 border-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Chỉnh âm lượng nhạc nền"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {/* Popover âm lượng mở ra ngoài */}
            {showVolumePop && (
              <div
                ref={volumePopRef}
                className="absolute right-0 top-full mt-2 w-9 h-40 p-2 bg-slate-900/98 border border-slate-700 rounded-xl shadow-2xl flex flex-col items-center justify-between z-50 animate-fadeIn backdrop-blur-md"
              >
                <span className="text-[8px] font-black text-rose-400">MAX</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={bgmVolume}
                  onChange={(e) => {
                    const vol = Number(e.target.value);
                    setBgmVolume(vol);
                    memorySound.setBgmVolume(vol);
                  }}
                  className="h-28 w-1.5 accent-rose-500 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                />
                <span className="text-[8px] font-black text-slate-500">0</span>
              </div>
            )}

            {/* Tiếng hiệu ứng SFX */}
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                memorySound.sfxEnabled = next;
              }}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title={soundEnabled ? 'Tắt tiếng hiệu ứng' : 'Bật tiếng hiệu ứng'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Nút Bảng xếp hạng */}
          <button
            type="button"
            onClick={() => setIsLeaderboardOpen(true)}
            title="Bảng xếp hạng kỷ lục"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 cursor-pointer shadow-sm transition-all"
          >
            <Trophy className="w-4 h-4" />
          </button>

          {/* Nút Chơi lại trận mới */}
          <button
            type="button"
            onClick={handleRestartFullGame}
            title="Chơi lại từ đầu (Reset 10 phút)"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. VÙNG BÀN CỜ LẬT BÀI (Ô VUÔNG CHUẨN PIKACHU, SẮC NÉT, CO GIÃN TỐI ƯU) */}
      <main className="flex-1 w-full flex items-center justify-center p-2 sm:p-4 overflow-hidden relative">
        <div
          className="grid gap-2 sm:gap-2.5 items-center justify-center mx-auto transition-all"
          style={{
            gridTemplateColumns: `repeat(${stage.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${stage.rows}, minmax(0, 1fr))`,
            // Giới hạn kích thước tối đa 68px mỗi ô vuông như Pikachu để ảnh luôn sắc nét 100%
            width: `min(calc(100vw - 32px), calc((100vh - 140px) * ${stage.cols} / ${stage.rows}), ${
              stage.cols * 68 + (stage.cols - 1) * 10
            }px)`,
            height: `min(calc(100vh - 140px), calc((100vw - 32px) * ${stage.rows} / ${stage.cols}), ${
              stage.rows * 68 + (stage.rows - 1) * 10
            }px)`,
            aspectRatio: `${stage.cols} / ${stage.rows}`,
          }}
        >
          {cards.map((card, idx) => {
            const isFlipped = card.isFlipped || card.isMatched;
            const photoUrl = getTilePhotoUrl(card.photoId, customPhotos);

            return (
              <div
                key={card.uniqueId}
                onClick={() => !card.isMatched && handleCardClick(idx)}
                style={{ perspective: '1000px' }}
                className={`w-full h-full aspect-square relative select-none transition-all duration-300 ${
                  card.isMatched
                    ? 'opacity-0 scale-75 pointer-events-none invisible'
                    : 'cursor-pointer group'
                }`}
              >
                <div
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                  className={`w-full h-full rounded-lg sm:rounded-xl transition-transform duration-300 relative shadow-md ${
                    isFlipped && !card.isMatched
                      ? 'ring-2 ring-amber-400 scale-105 z-20 shadow-[0_0_14px_rgba(251,191,36,0.6)]'
                      : ''
                  }`}
                >
                  {/* MẶT LƯNG LÁ BÀI (Úp mặt): In Logo Chú chim Flappy Phuong - phong cách Pikachu */}
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.5)',
                    }}
                    className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border-2 border-slate-700/80 group-hover:border-amber-400/80 group-hover:scale-[1.03] transition-all flex flex-col items-center justify-center p-1 overflow-hidden"
                  >
                    <div className="w-4/5 h-4/5 flex items-center justify-center pointer-events-none opacity-90 group-hover:scale-110 transition-transform">
                      <BirdAvatar size={Math.min(42, Math.max(22, Math.floor(320 / stage.cols)))} animate={false} />
                    </div>
                  </div>

                  {/* MẶT TRƯỚC LÁ BÀI (Ngửa mặt): Hiển thị ảnh sắc nét */}
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      boxShadow: '0 0 12px #facc15',
                    }}
                    className="absolute inset-0 rounded-lg sm:rounded-xl bg-slate-900 border-2 border-yellow-400 overflow-hidden flex items-center justify-center"
                  >
                    <img
                      src={photoUrl}
                      alt={`Photo ${card.photoId}`}
                      style={{
                        imageRendering: '-webkit-optimize-contrast',
                      }}
                      className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = './flappy-face.jpg';
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 3. THANH TRẠNG THÁI DƯỚI CÙNG */}
      <footer className="shrink-0 h-10 px-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 z-20">
        <div className="flex items-center gap-2">
          <span>Tiến độ màn:</span>
          <strong className="text-amber-300 font-extrabold">
            {matchedPairsInStage} / {stage.pairsCount} cặp
          </strong>
        </div>

        <div className="flex items-center gap-3 font-semibold">
          <span>Tổng cặp đã ghép: <strong className="text-white font-extrabold">{totalPairsMatched}</strong></span>
          <span className="hidden sm:inline">• Kỷ lục: <strong className="text-emerald-400">{bestScore.toLocaleString()}</strong></span>
        </div>
      </footer>

      {/* MODAL HOÀN THÀNH MÀN (STAGE CLEAR) */}
      {gameState === 'stage_cleared' && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="inline-block p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>

            <h2 className="text-xl font-black font-arcade text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-300">
              HOÀN THÀNH MÀN {stage.stage}!
            </h2>

            <p className="text-xs text-slate-300">
              Xuất sắc! Chuẩn bị bước vào <strong>Màn {stage.stage + 1}: {MEMORY_STAGES[currentStageIdx + 1]?.name}</strong>!
            </p>

            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-bold px-4">
              <span className="text-slate-400">Điểm hiện tại:</span>
              <span className="text-amber-300 font-arcade text-sm">{score.toLocaleString()}</span>
            </div>

            <button
              type="button"
              onClick={handleNextStage}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
            >
              <span>VÀO MÀN TIẾP THEO</span>
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL HẾT GIỜ (GAME OVER) */}
      {gameState === 'game_over' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <h2 className="text-xl font-black font-arcade text-rose-400">
              HẾT GIỜ 10 PHÚT!
            </h2>

            <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Màn cao nhất đạt được:</span>
                <span className="font-extrabold text-rose-300">Màn {stage.stage} / 8</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400 font-bold">Tổng cặp đã ghép:</span>
                <span className="font-extrabold text-white">{totalPairsMatched} cặp</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400 font-bold">Tổng điểm ghi được:</span>
                <span className="text-base font-black text-amber-300 font-arcade">
                  {score.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400 font-bold">Kỷ lục:</span>
                <div className="flex items-center gap-1.5">
                  {isNewBest && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500 text-slate-950 font-black text-[9px] animate-bounce">
                      MỚI!
                    </span>
                  )}
                  <span className="font-black text-emerald-400 font-arcade">
                    {bestScore.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRestartFullGame}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>CHƠI LẠI TRẬN MỚI (10 PHÚT)</span>
            </button>

            <button
              type="button"
              onClick={onBackToLobby}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
            >
              Về Menu chính
            </button>
          </div>
        </div>
      )}

      {/* MODAL PHÁ ĐẢO TOÀN BỘ 8 MÀN (VICTORY) */}
      {gameState === 'victory' && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="inline-block p-4 rounded-full bg-amber-400/20 text-yellow-400">
              <Trophy className="w-12 h-12 animate-bounce" />
            </div>

            <h2 className="text-2xl font-black font-arcade text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-400 to-pink-400">
              PHÁ ĐẢO CỰC HẠN!
            </h2>

            <p className="text-xs text-amber-200">
              Bạn đã hoàn thành trọn vẹn cả 8 màn chơi và mở khóa toàn bộ 72 lá bài của Em bé iu Thúy Phượng!
            </p>

            <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Thời gian còn lại:</span>
                <span className="font-extrabold text-emerald-400">{formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400 font-bold">Tổng điểm kỷ lục:</span>
                <span className="text-lg font-black text-amber-300 font-arcade">{score.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRestartFullGame}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>CHƠI LẠI TRẬN MỚI</span>
            </button>

            <button
              type="button"
              onClick={onBackToLobby}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
            >
              Về Menu chính
            </button>
          </div>
        </div>
      )}

      {/* MODAL BẢNG XẾP HẠNG KỶ LỤC */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        entries={leaderboard}
        onClose={() => setIsLeaderboardOpen(false)}
        onClear={() => {
          clearLeaderboard(MEMORY_LEADERBOARD_KEY);
          setLeaderboard([]);
        }}
        title="Bảng xếp hạng Phuong Memory"
        subtitle="Lịch sử trí nhớ siêu phàm của Em bé iu"
        stageColumnLabel="Màn đạt được"
        stageBadgePrefix="Màn"
      />
    </div>
  );
};
