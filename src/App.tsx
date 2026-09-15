import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Position, GameStatus } from './types/game';
import {
  generateBoard,
  findPath,
  findValidPair,
  shuffleBoardInPlace,
  countRemainingTiles,
} from './core/algorithm';
import { STAGE_CONFIGS, applyGravity } from './core/gravity';
import { sound } from './core/sound';
import { getAllCustomPhotos } from './utils/photoStorage';
import { GameHeader } from './components/GameHeader';
import { GameBoard } from './components/GameBoard';
import { PhotoManagerModal } from './components/PhotoManagerModal';
import { StageClearModal } from './components/StageClearModal';
import { GameOverModal } from './components/GameOverModal';

export const App: React.FC = () => {
  const [stageIndex, setStageIndex] = useState(0);
  const stageConfig = STAGE_CONFIGS[stageIndex];

  const [board, setBoard] = useState<number[][]>(() => generateBoard());
  const [selectedTile, setSelectedTile] = useState<Position | null>(null);
  const [hintPair, setHintPair] = useState<{ p1: Position; p2: Position } | null>(null);
  const [lastPath, setLastPath] = useState<Position[] | null>(null);

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(stageConfig.timeSeconds);
  const [hintsLeft, setHintsLeft] = useState(10);
  const [shufflesLeft, setShufflesLeft] = useState(10);
  const [combo, setCombo] = useState(0);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [timeBonus, setTimeBonus] = useState(0);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [customPhotos, setCustomPhotos] = useState<Record<number, string>>({});
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Tải ảnh tùy chỉnh từ IndexedDB khi mở game
  useEffect(() => {
    getAllCustomPhotos().then((photos) => {
      setCustomPhotos(photos);
    });
  }, []);

  // Khởi tạo một màn chơi
  const startStage = useCallback((sIndex: number) => {
    const config = STAGE_CONFIGS[sIndex];
    setStageIndex(sIndex);
    const newBoard = generateBoard();
    setBoard(newBoard);
    setSelectedTile(null);
    setHintPair(null);
    setLastPath(null);
    setTimeLeft(config.timeSeconds);
    setCombo(0);
    setStatus('playing');
  }, []);

  // Đếm ngược thời gian
  useEffect(() => {
    if (status !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('game_over');
          sound.playGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // Click vào một ô trên bàn cờ
  const handleTileClick = (pos: Position) => {
    if (status !== 'playing') return;
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
      setScore((prev) => prev + addedScore);
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

      // Kiểm tra xem đã dọn sạch bàn cờ chưa
      const remaining = countRemainingTiles(nextBoard);
      if (remaining === 0) {
        sound.playVictory();
        const bonus = timeLeft * 15;
        setTimeBonus(bonus);
        setScore((prev) => prev + bonus);
        setStatus('stage_clear');
      } else {
        // Kiểm tra xem có bị bế tắc (Deadlock) không
        const validPair = findValidPair(nextBoard);
        if (!validPair) {
          // Tự động xáo bài nếu hết nước đi
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

      // Tự động tắt viền gợi ý sau 2.5 giây
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

  // Bật/tắt âm thanh
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
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
    setScore(0);
    setHintsLeft(10);
    setShufflesLeft(10);
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
        totalTime={stageConfig.timeSeconds}
        hintsLeft={hintsLeft}
        shufflesLeft={shufflesLeft}
        soundEnabled={soundEnabled}
        remainingPairs={remainingPairs}
        combo={combo}
        onHint={handleHint}
        onShuffle={handleShuffle}
        onToggleSound={handleToggleSound}
        onRestart={() => startStage(stageIndex)}
        onOpenPhotos={() => setIsPhotoModalOpen(true)}
      />

      {/* Bàn cờ chính */}
      <GameBoard
        board={board}
        selectedTile={selectedTile}
        hintPair={hintPair}
        lastPath={lastPath}
        customPhotos={customPhotos}
        onTileClick={handleTileClick}
      />

      {/* Chân trang / Ghi chú phím tắt */}
      <footer className="w-full max-w-[1180px] mt-2.5 flex items-center justify-between text-[11px] text-slate-500 px-2 font-medium">
        <span>Desktop Edition &bull; Chuẩn tỉ lệ 9x16 cổ điển</span>
        <span className="flex items-center gap-2">
          <span>Kích thước lưới: 144 ô</span>
          <span>&bull;</span>
          <button
            type="button"
            onClick={() => setIsPhotoModalOpen(true)}
            className="text-amber-400 hover:underline cursor-pointer"
          >
            Tùy biến 36 ảnh
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
