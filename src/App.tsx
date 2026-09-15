import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Position, GameStatus, GameSettings, LeaderboardEntry } from './types/game';
import {
  generateBoard,
  findPath,
  findValidPair,
  shuffleBoardInPlace,
  countRemainingTiles,
} from './core/algorithm';
import { STAGE_CONFIGS, applyGravity, generateRotations } from './core/gravity';
import { sound } from './core/sound';
import { bgm } from './core/bgm';
import { getAllCustomPhotos } from './utils/photoStorage';
import { loadSettings, saveSettings } from './utils/settings';
import { getLeaderboard, saveLeaderboardEntry, clearLeaderboard } from './utils/leaderboard';
import { GameHeader } from './components/GameHeader';
import { GameBoard } from './components/GameBoard';
import { PhotoManagerModal } from './components/PhotoManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { StageClearModal } from './components/StageClearModal';
import { GameOverModal } from './components/GameOverModal';

export const App: React.FC = () => {
  // Cài đặt game
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());

  const [stageIndex, setStageIndex] = useState(0);
  const stageConfig = STAGE_CONFIGS[stageIndex];

  const [board, setBoard] = useState<number[][]>(() => generateBoard());
  const [rotations, setRotations] = useState<number[][] | null>(null);
  const [selectedTile, setSelectedTile] = useState<Position | null>(null);
  const [hintPair, setHintPair] = useState<{ p1: Position; p2: Position } | null>(null);
  const [lastPath, setLastPath] = useState<Position[] | null>(null);

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.stageTimeSeconds);
  const [hintsLeft, setHintsLeft] = useState(settings.hintsCount);
  const [shufflesLeft, setShufflesLeft] = useState(settings.shufflesCount);
  const [combo, setCombo] = useState(0);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [timeBonus, setTimeBonus] = useState(0);

  // Nhạc nền & Âm thanh
  const [soundEnabled, setSoundEnabled] = useState(settings.sfxEnabled);
  const [bgmEnabled, setBgmEnabled] = useState(settings.bgmEnabled);

  // Toàn màn hình F11
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  // Modals
  const [customPhotos, setCustomPhotos] = useState<Record<number, string>>({});
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => getLeaderboard());

  // Theo dõi thời gian chơi tổng cộng để lưu kỷ lục
  const sessionStartTimeRef = useRef(Date.now());

  // Khởi tạo BGM và load ảnh từ IndexedDB
  useEffect(() => {
    getAllCustomPhotos().then((photos) => {
      setCustomPhotos(photos);
    });

    bgm.volume = settings.bgmVolume;
    bgm.setEnabled(settings.bgmEnabled);

    // Lắng nghe sự kiện F11 / Fullscreen thay đổi
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  // Khởi tạo một màn chơi
  const startStage = useCallback((sIndex: number, currentSettings = settings) => {
    const config = STAGE_CONFIGS[sIndex];
    setStageIndex(sIndex);
    const newBoard = generateBoard();
    setBoard(newBoard);

    // Xử lý xoay 4 hướng nếu là Màn 9
    if (config.gravity === 'rotate') {
      setRotations(generateRotations());
    } else {
      setRotations(null);
    }

    setSelectedTile(null);
    setHintPair(null);
    setLastPath(null);
    setTimeLeft(currentSettings.stageTimeSeconds);
    setCombo(0);
    setStatus('playing');
  }, [settings]);

  // Đếm ngược thời gian
  useEffect(() => {
    if (status !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('game_over');
          sound.playGameOver();

          // Lưu kỷ lục khi kết thúc ván chơi
          const timeSpent = Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
          const updatedLb = saveLeaderboardEntry({
            score,
            stageReached: stageIndex + 1,
            timeSpentSeconds: timeSpent,
          });
          setLeaderboard(updatedLb);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, score, stageIndex]);

  // Bật/tắt Fullscreen (F11)
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Cập nhật cài đặt
  const handleSaveSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);

    // Cập nhật BGM
    setBgmEnabled(newSettings.bgmEnabled);
    bgm.setVolume(newSettings.bgmVolume);
    bgm.setEnabled(newSettings.bgmEnabled);

    // Cập nhật SFX
    setSoundEnabled(newSettings.sfxEnabled);
    sound.enabled = newSettings.sfxEnabled;

    // Cập nhật lượt trợ giúp và thời gian cho ván
    setHintsLeft(newSettings.hintsCount);
    setShufflesLeft(newSettings.shufflesCount);
    setTimeLeft(newSettings.stageTimeSeconds);
  };

  // Bật/tắt nhạc nền nhanh
  const handleToggleBgm = () => {
    const next = !bgmEnabled;
    setBgmEnabled(next);
    bgm.setEnabled(next);
    const nextSettings = { ...settings, bgmEnabled: next };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  // Bật/tắt âm thanh hiệu ứng nhanh
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
    const nextSettings = { ...settings, sfxEnabled: next };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  // Click vào một ô trên bàn cờ
  const handleTileClick = (pos: Position) => {
    if (status !== 'playing') return;
    // Bật nhạc nền tự động ngay lần tương tác đầu tiên nếu chưa phát
    if (bgmEnabled) {
      bgm.play();
    }

    const tileVal = board[pos.r][pos.c];
    if (tileVal === 0) return;

    // 1. Chưa chọn ô nào trước đó
    if (!selectedTile) {
      sound.playClick();
      setSelectedTile(pos);
      setHintPair(null);
      return;
    }

    // 2. Click lại đúng ô đang chọn -> Hủy chọn
    if (selectedTile.r === pos.r && selectedTile.c === pos.c) {
      setSelectedTile(null);
      return;
    }

    // 3. Click vào ô khác loại -> Đổi sang chọn ô mới
    const selectedVal = board[selectedTile.r][selectedTile.c];
    if (selectedVal !== tileVal) {
      sound.playClick();
      setSelectedTile(pos);
      return;
    }

    // 4. Click vào ô cùng loại -> Kiểm tra đường nối
    const path = findPath(board, selectedTile, pos);

    if (path) {
      // Nối thành công!
      sound.playMatch();
      setLastPath(path);

      // Tính điểm và combo
      const addedScore = 100 + combo * 25;
      const newScore = score + addedScore;
      setScore(newScore);
      setCombo((prev) => prev + 1);

      // Tạo bản sao bàn cờ và xóa 2 ô vừa ăn
      let nextBoard = board.map((row) => [...row]);
      nextBoard[selectedTile.r][selectedTile.c] = 0;
      nextBoard[pos.r][pos.c] = 0;

      // Áp dụng cơ chế dồn ô của màn chơi
      nextBoard = applyGravity(nextBoard, stageConfig.gravity);

      // Reset ô chọn và gợi ý
      setSelectedTile(null);
      setHintPair(null);

      // Kiểm tra dọn sạch bàn cờ
      const remaining = countRemainingTiles(nextBoard);
      if (remaining === 0) {
        sound.playVictory();
        const bonus = timeLeft * 15;
        setTimeBonus(bonus);
        const finalScore = newScore + bonus;
        setScore(finalScore);

        if (stageIndex === STAGE_CONFIGS.length - 1) {
          // Phá đảo toàn diện Màn 9
          const timeSpent = Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
          const updatedLb = saveLeaderboardEntry({
            score: finalScore,
            stageReached: STAGE_CONFIGS.length,
            timeSpentSeconds: timeSpent,
          });
          setLeaderboard(updatedLb);
        }

        setStatus('stage_clear');
      } else {
        // Kiểm tra bế tắc (Deadlock)
        const validPair = findValidPair(nextBoard);
        if (!validPair) {
          sound.playShuffle();
          shuffleBoardInPlace(nextBoard);
        }
      }

      setBoard(nextBoard);
    } else {
      // Không thể nối được -> Báo lỗi & chọn ô mới
      sound.playMismatch();
      setSelectedTile(pos);
    }
  };

  // Trợ giúp: Gợi ý nước đi
  const handleHint = () => {
    if (hintsLeft <= 0 || status !== 'playing') return;
    const pair = findValidPair(board);
    if (pair) {
      sound.playHint();
      setHintsLeft((prev) => prev - 1);
      setHintPair({ p1: pair.p1, p2: pair.p2 });

      setTimeout(() => {
        setHintPair(null);
      }, 2500);
    }
  };

  // Trợ giúp: Đổi vị trí thủ công
  const handleShuffle = () => {
    if (shufflesLeft <= 0 || status !== 'playing') return;
    sound.playShuffle();
    setShufflesLeft((prev) => prev - 1);
    setSelectedTile(null);
    setHintPair(null);

    const nextBoard = board.map((row) => [...row]);
    shuffleBoardInPlace(nextBoard);
    setBoard(nextBoard);
  };

  // Sang màn kế tiếp
  const handleNextStage = () => {
    if (stageIndex < STAGE_CONFIGS.length - 1) {
      startStage(stageIndex + 1);
    } else {
      setStatus('victory');
    }
  };

  // Chơi lại từ đầu
  const handleRestartFromBeginning = () => {
    sessionStartTimeRef.current = Date.now();
    setScore(0);
    setHintsLeft(settings.hintsCount);
    setShufflesLeft(settings.shufflesCount);
    startStage(0);
  };

  const remainingTiles = countRemainingTiles(board);
  const remainingPairs = Math.floor(remainingTiles / 2);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-3 antialiased">
      {/* Thanh điều khiển trên cùng */}
      <GameHeader
        stageConfig={stageConfig}
        score={score}
        timeLeft={timeLeft}
        totalTime={settings.stageTimeSeconds}
        hintsLeft={hintsLeft}
        shufflesLeft={shufflesLeft}
        soundEnabled={soundEnabled}
        bgmEnabled={bgmEnabled}
        remainingPairs={remainingPairs}
        combo={combo}
        isFullscreen={isFullscreen}
        onHint={handleHint}
        onShuffle={handleShuffle}
        onToggleSound={handleToggleSound}
        onToggleBgm={handleToggleBgm}
        onRestart={() => startStage(stageIndex)}
        onOpenPhotos={() => setIsPhotoModalOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Bàn cờ chính */}
      <GameBoard
        board={board}
        selectedTile={selectedTile}
        hintPair={hintPair}
        lastPath={lastPath}
        customPhotos={customPhotos}
        rotations={rotations}
        onTileClick={handleTileClick}
      />

      {/* Chân trang / Ghi chú */}
      <footer className="w-full max-w-[1180px] mt-2.5 flex items-center justify-between text-[11px] text-slate-500 px-2 font-medium">
        <span className="flex items-center gap-1.5">
          <span>Em bé iu ❤️</span>
          <span>&bull;</span>
          <span>Desktop Edition</span>
          <span>&bull;</span>
          <span>9 Màn chơi thử thách</span>
        </span>
        <span className="flex items-center gap-2">
          <span>Kích thước lưới: 144 ô</span>
          <span>&bull;</span>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="text-amber-400 hover:underline cursor-pointer"
          >
            Cài đặt (10 phút)
          </button>
          <span>&bull;</span>
          <button
            type="button"
            onClick={() => setIsLeaderboardOpen(true)}
            className="text-amber-400 hover:underline cursor-pointer"
          >
            Bảng xếp hạng
          </button>
        </span>
      </footer>

      {/* Modal nạp & quản lý ảnh */}
      <PhotoManagerModal
        isOpen={isPhotoModalOpen}
        customPhotos={customPhotos}
        onClose={() => setIsPhotoModalOpen(false)}
        onPhotosUpdated={(photos) => {
          setCustomPhotos(photos);
        }}
      />

      {/* Modal Cài đặt */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      {/* Modal Bảng xếp hạng 20 lượt chơi */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        entries={leaderboard}
        onClose={() => setIsLeaderboardOpen(false)}
        onClear={() => {
          clearLeaderboard();
          setLeaderboard([]);
        }}
      />

      {/* Modal hoàn thành màn chơi */}
      <StageClearModal
        isOpen={status === 'stage_clear'}
        stageConfig={stageConfig}
        score={score}
        timeBonus={timeBonus}
        isLastStage={stageIndex === STAGE_CONFIGS.length - 1}
        onNextStage={handleNextStage}
        onRestartGame={handleRestartFromBeginning}
      />

      {/* Modal Game Over */}
      <GameOverModal
        isOpen={status === 'game_over'}
        stageConfig={stageConfig}
        score={score}
        onRetryStage={() => startStage(stageIndex)}
        onRestartFromBeginning={handleRestartFromBeginning}
      />
    </main>
  );
};

export default App;
