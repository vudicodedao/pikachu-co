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
import { GameSidebar } from './components/GameSidebar';
import { GameBoard } from './components/GameBoard';
import { PhotoManagerModal } from './components/PhotoManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { StageClearModal } from './components/StageClearModal';
import { GameOverModal } from './components/GameOverModal';
import { FlappyGame } from './components/FlappyGame';
import { GameLobby } from './components/GameLobby';
import { MemoryGame } from './components/MemoryGame';
import { CatcherGame } from './components/CatcherGame';

export const App: React.FC = () => {
  // Chế độ màn hình: 'lobby' (Sảnh chọn game), 'pikachu', 'flappy', 'memory', 'catcher'
  const [activeView, setActiveView] = useState<'lobby' | 'pikachu' | 'flappy' | 'memory' | 'catcher'>('lobby');

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

  // Snapshot trạng thái đầu mỗi màn để khi "Thử lại màn này", hệ thống hoàn nguyên chính xác
  const [stageStartScore, setStageStartScore] = useState(0);
  const [stageStartHints, setStageStartHints] = useState(settings.hintsCount);
  const [stageStartShuffles, setStageStartShuffles] = useState(settings.shufflesCount);

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
    // Mặc định ở sảnh chính không phát nhạc nền để tránh ồn
    bgm.setEnabled(false);

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

  // Cập nhật cài đặt -> Bắt đầu lại ván mới từ Màn 1 với điểm số 0 theo yêu cầu
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

    // Reset toàn bộ hệ thống về ván mới từ Màn 1
    sessionStartTimeRef.current = Date.now();
    setScore(0);
    setStageStartScore(0);
    setHintsLeft(newSettings.hintsCount);
    setStageStartHints(newSettings.hintsCount);
    setShufflesLeft(newSettings.shufflesCount);
    setStageStartShuffles(newSettings.shufflesCount);
    startStage(0, newSettings);
  };

  // Chỉnh âm lượng BGM từ popover header
  const handleChangeBgmVolume = (vol: number) => {
    bgm.setVolume(vol);
    const updated = { ...settings, bgmVolume: vol };
    setSettings(updated);
    saveSettings(updated);
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

  // Chơi lại màn hiện tại: Hoàn nguyên toàn bộ hệ thống (điểm, gợi ý, xáo, thời gian) về đầu màn
  const handleRetryStage = () => {
    setScore(stageStartScore);
    setHintsLeft(stageStartHints);
    setShufflesLeft(stageStartShuffles);
    startStage(stageIndex);
  };

  // Sang màn kế tiếp: Lưu snapshot trước khi bắt đầu màn mới
  const handleNextStage = () => {
    if (stageIndex < STAGE_CONFIGS.length - 1) {
      const nextIdx = stageIndex + 1;
      setStageStartScore(score);
      setStageStartHints(hintsLeft);
      setStageStartShuffles(shufflesLeft);
      startStage(nextIdx);
    } else {
      setStatus('victory');
    }
  };

  // Chơi lại từ đầu Màn 1: Reset toàn bộ điểm và các thông số
  const handleRestartFromBeginning = () => {
    sessionStartTimeRef.current = Date.now();
    setScore(0);
    setStageStartScore(0);
    setHintsLeft(settings.hintsCount);
    setStageStartHints(settings.hintsCount);
    setShufflesLeft(settings.shufflesCount);
    setStageStartShuffles(settings.shufflesCount);
    startStage(0);
  };

  // Vào game Pikachu: bật lại nhạc nền nếu người dùng đã bật trong settings
  const handleEnterPikachu = () => {
    setActiveView('pikachu');
    if (settings.bgmEnabled && bgmEnabled) {
      bgm.setEnabled(true);
    }
  };

  // Vào game Flappy Bird: ngắt nhạc nền Pikachu hoàn toàn
  const handleEnterFlappy = () => {
    bgm.setEnabled(false);
    setActiveView('flappy');
  };

  // Vào game Phuong Memory (Lật bài): ngắt nhạc nền Pikachu hoàn toàn
  const handleEnterMemory = () => {
    bgm.setEnabled(false);
    setActiveView('memory');
  };

  // Vào game Phuong Catcher (Siêu nhân hứng bạn gái): ngắt nhạc nền Pikachu
  const handleEnterCatcher = () => {
    bgm.setEnabled(false);
    setActiveView('catcher');
  };

  // Quay về Sảnh chính (Lobby): tắt toàn bộ âm thanh
  const handleBackToLobby = () => {
    bgm.setEnabled(false);
    setActiveView('lobby');
  };

  // 1. MÀN HÌNH SẢNH CHỌN GAME (LOBBY)
  if (activeView === 'lobby') {
    return (
      <GameLobby
        onSelectPikachu={handleEnterPikachu}
        onSelectFlappy={handleEnterFlappy}
        onSelectMemory={handleEnterMemory}
        onSelectCatcher={handleEnterCatcher}
        pikachuBestScore={leaderboard[0]?.score || 0}
      />
    );
  }

  // 2. GAME FLAPPY BIRD
  if (activeView === 'flappy') {
    return <FlappyGame onBackToLobby={handleBackToLobby} />;
  }

  // 3. GAME PHUONG MEMORY (LẬT BÀI 8 MÀN 10 PHÚT)
  if (activeView === 'memory') {
    return <MemoryGame onBackToLobby={handleBackToLobby} />;
  }

  // 4. GAME PHUONG CATCHER (SIÊU NHÂN HỨNG BẠN GÁI & TIM)
  if (activeView === 'catcher') {
    return <CatcherGame onBackToLobby={handleBackToLobby} />;
  }

  // 3. GAME PIKACHU
  const remainingTiles = countRemainingTiles(board);
  const remainingPairs = Math.floor(remainingTiles / 2);

  return (
    <main className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-row overflow-hidden select-none">
      {/* Cột Sidebar bên trái thu gọn */}
      <GameSidebar
        stageConfig={stageConfig}
        score={score}
        timeLeft={timeLeft}
        totalTime={settings.stageTimeSeconds}
        hintsLeft={hintsLeft}
        shufflesLeft={shufflesLeft}
        soundEnabled={soundEnabled}
        bgmEnabled={bgmEnabled}
        bgmVolume={settings.bgmVolume}
        remainingPairs={remainingPairs}
        combo={combo}
        isFullscreen={isFullscreen}
        onHint={handleHint}
        onShuffle={handleShuffle}
        onToggleSound={handleToggleSound}
        onToggleBgm={handleToggleBgm}
        onChangeBgmVolume={handleChangeBgmVolume}
        onRestart={handleRetryStage}
        onOpenPhotos={() => setIsPhotoModalOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleFullscreen={handleToggleFullscreen}
        onBackToLobby={handleBackToLobby}
      />

      {/* Khu vực Bàn cờ bên phải mở rộng tối đa theo toàn bộ chiều cao màn hình */}
      <div className="flex-1 h-screen flex items-center justify-center p-2 sm:p-3 overflow-hidden relative">
        <GameBoard
          board={board}
          selectedTile={selectedTile}
          hintPair={hintPair}
          lastPath={lastPath}
          customPhotos={customPhotos}
          rotations={rotations}
          onTileClick={handleTileClick}
        />
      </div>

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
        onRetryStage={handleRetryStage}
        onRestartFromBeginning={handleRestartFromBeginning}
      />
    </main>
  );
};

export default App;
