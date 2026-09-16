import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, RotateCcw, ArrowLeft, Trophy, Maximize, Minimize, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { flappySound } from '../core/flappySound';

interface FlappyGameProps {
  onBackToLobby: () => void;
}

interface Pipe {
  x: number;
  gapY: number;
  gapHeight: number;
  passed: boolean;
}

interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const GROUND_HEIGHT = 75;
const GRAVITY = 0.38;
const JUMP_IMPULSE = -7.2;
const PIPE_SPEED = 2.2;
const PIPE_WIDTH = 52;
const PIPE_CAP_WIDTH = 60;
const PIPE_CAP_HEIGHT = 24;
const PIPE_SPAWN_INTERVAL = 95; // frames

export const FlappyGame: React.FC<FlappyGameProps> = ({ onBackToLobby }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'game_over'>('idle');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return Number(localStorage.getItem('flappy_phuong_best') || 0);
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);

  // Head Canvas pre-processed from public/flappy-face.jpg
  const headCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game Engine Refs
  const birdRef = useRef({
    x: 100,
    y: 260,
    velocity: 0,
    rotation: 0,
    flapFrame: 0,
    flapTimer: 0,
    radius: 16,
  });

  const pipesRef = useRef<Pipe[]>([]);
  const cloudsRef = useRef<Cloud[]>([
    { x: 40, y: 80, scale: 1, speed: 0.3 },
    { x: 190, y: 140, scale: 0.75, speed: 0.2 },
    { x: 320, y: 60, scale: 1.2, speed: 0.4 },
  ]);
  const groundOffsetRef = useRef(0);
  const frameCountRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const gameStateRef = useRef<'idle' | 'playing' | 'game_over'>('idle');
  const scoreRef = useRef(0);

  // Đồng bộ gameStateRef và sound
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    flappySound.enabled = soundEnabled;
  }, [soundEnabled]);

  // Pre-crop head image into circular avatar
  useEffect(() => {
    const img = new Image();
    img.src = './flappy-face.jpg';
    img.onload = () => {
      const hCanvas = document.createElement('canvas');
      hCanvas.width = 120;
      hCanvas.height = 120;
      const hCtx = hCanvas.getContext('2d')!;

      // Cắt hình tròn tập trung vào khuôn mặt (tâm 60, 48, bán kính 44px)
      hCtx.save();
      hCtx.beginPath();
      hCtx.ellipse(60, 48, 44, 44, 0, 0, Math.PI * 2);
      hCtx.closePath();
      hCtx.clip();
      hCtx.drawImage(img, 0, 0, 120, 120);
      hCtx.restore();

      // Viền màu hổ phách bảo vệ quanh khuôn mặt
      hCtx.save();
      hCtx.beginPath();
      hCtx.ellipse(60, 48, 44, 44, 0, 0, Math.PI * 2);
      hCtx.lineWidth = 4;
      hCtx.strokeStyle = '#f59e0b';
      hCtx.stroke();
      hCtx.restore();

      headCanvasRef.current = hCanvas;
    };
  }, []);

  // Khởi động lại game
  const resetGame = useCallback(() => {
    birdRef.current = {
      x: 100,
      y: 260,
      velocity: 0,
      rotation: 0,
      flapFrame: 0,
      flapTimer: 0,
      radius: 16,
    };
    pipesRef.current = [];
    groundOffsetRef.current = 0;
    frameCountRef.current = 0;
    scoreRef.current = 0;
    setScore(0);
    setIsNewBest(false);
    setGameState('playing');
    flappySound.playFlap();
  }, []);

  // Xử lý cú nhảy của chim
  const handleJump = useCallback(() => {
    if (gameStateRef.current === 'idle') {
      resetGame();
      return;
    }
    if (gameStateRef.current === 'game_over') {
      resetGame();
      return;
    }
    if (gameStateRef.current === 'playing') {
      birdRef.current.velocity = JUMP_IMPULSE;
      flappySound.playFlap();
    }
  }, [resetGame]);

  // Lắng nghe phím Space / Phím lên
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Vòng lặp chính Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(32, time - lastTime);
      lastTime = time;

      // UPDATE LOGIC
      frameCountRef.current++;
      const bird = birdRef.current;
      const state = gameStateRef.current;

      // 1. Cập nhật đám mây
      cloudsRef.current.forEach((cloud) => {
        cloud.x -= cloud.speed;
        if (cloud.x < -100) cloud.x = CANVAS_WIDTH + 50;
      });

      // 2. Cập nhật nền đất
      if (state !== 'game_over') {
        groundOffsetRef.current = (groundOffsetRef.current + PIPE_SPEED) % 24;
      }

      // 3. Logic theo trạng thái
      if (state === 'idle') {
        // Chim bay dập dờn nhẹ
        bird.y = 260 + Math.sin(time * 0.005) * 8;
        bird.rotation = 0;
        bird.flapTimer++;
        if (bird.flapTimer % 8 === 0) {
          bird.flapFrame = (bird.flapFrame + 1) % 3;
        }
      } else if (state === 'playing') {
        // Vật lý chim
        bird.velocity += GRAVITY;
        bird.y += bird.velocity;

        // Góc quay của chim
        if (bird.velocity < 0) {
          bird.rotation = Math.max(-0.4, bird.rotation - 0.12);
        } else {
          bird.rotation = Math.min(1.2, bird.rotation + 0.05);
        }

        // Vỗ cánh
        bird.flapTimer++;
        if (bird.flapTimer % 6 === 0) {
          bird.flapFrame = (bird.flapFrame + 1) % 3;
        }

        // Tạo ống mới
        if (frameCountRef.current % PIPE_SPAWN_INTERVAL === 0) {
          const gapY = Math.floor(Math.random() * (CANVAS_HEIGHT - GROUND_HEIGHT - 240)) + 120;
          pipesRef.current.push({
            x: CANVAS_WIDTH + 20,
            gapY,
            gapHeight: 135,
            passed: false,
          });
        }

        // Cập nhật ống và tính điểm
        for (let i = pipesRef.current.length - 1; i >= 0; i--) {
          const pipe = pipesRef.current[i];
          pipe.x -= PIPE_SPEED;

          // Tính điểm khi vượt qua tâm ống
          if (!pipe.passed && pipe.x + PIPE_WIDTH / 2 < bird.x) {
            pipe.passed = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
            flappySound.playPoint();

            // Cập nhật Best Score
            if (scoreRef.current > bestScore) {
              setBestScore(scoreRef.current);
              localStorage.setItem('flappy_phuong_best', scoreRef.current.toString());
              setIsNewBest(true);
            }
          }

          // Xóa ống đã đi qua màn hình
          if (pipe.x < -PIPE_WIDTH - 20) {
            pipesRef.current.splice(i, 1);
          }
        }

        // Kiểm tra va chạm mặt đất
        const floorY = CANVAS_HEIGHT - GROUND_HEIGHT - bird.radius;
        if (bird.y >= floorY) {
          bird.y = floorY;
          setGameState('game_over');
          flappySound.playHit();
          flappySound.playDie();
          if (scoreRef.current >= 15) {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
          }
        }

        // Chạm trần
        if (bird.y <= bird.radius) {
          bird.y = bird.radius;
          bird.velocity = 0;
        }

        // Kiểm tra va chạm ống (Hitbox hình tròn của chim và chữ nhật của ống)
        for (const pipe of pipesRef.current) {
          const topPipeBottom = pipe.gapY - pipe.gapHeight / 2;
          const bottomPipeTop = pipe.gapY + pipe.gapHeight / 2;

          // Hitbox ống nằm ngang: [pipe.x, pipe.x + PIPE_WIDTH]
          if (
            bird.x + bird.radius - 4 > pipe.x &&
            bird.x - bird.radius + 4 < pipe.x + PIPE_WIDTH
          ) {
            // Va chạm ống trên hoặc ống dưới
            if (
              bird.y - bird.radius + 4 < topPipeBottom ||
              bird.y + bird.radius - 4 > bottomPipeTop
            ) {
              setGameState('game_over');
              flappySound.playHit();
              flappySound.playDie();
              if (scoreRef.current >= 15) {
                confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
              }
              break;
            }
          }
        }
      } else if (state === 'game_over') {
        // Rơi tự do xuống đất khi chết
        const floorY = CANVAS_HEIGHT - GROUND_HEIGHT - bird.radius;
        if (bird.y < floorY) {
          bird.velocity += GRAVITY * 1.5;
          bird.y = Math.min(floorY, bird.y + bird.velocity);
          bird.rotation = Math.min(1.4, bird.rotation + 0.1);
        }
      }

      // RENDER CANVAS
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 1. Vẽ Bầu trời
      const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT);
      skyGradient.addColorStop(0, '#38bdf8');
      skyGradient.addColorStop(0.7, '#7dd3fc');
      skyGradient.addColorStop(1, '#bae6fd');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);

      // 2. Vẽ Đám mây
      cloudsRef.current.forEach((cloud) => {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        const r = 20 * cloud.scale;
        ctx.arc(cloud.x, cloud.y, r, 0, Math.PI * 2);
        ctx.arc(cloud.x + r * 0.9, cloud.y - r * 0.3, r * 0.85, 0, Math.PI * 2);
        ctx.arc(cloud.x + r * 1.8, cloud.y, r * 0.95, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // 3. Vẽ Đường chân trời thành phố xa
      ctx.fillStyle = '#93c5fd';
      for (let i = 0; i < CANVAS_WIDTH; i += 40) {
        const h = 30 + ((i * 17) % 45);
        ctx.fillRect(i, CANVAS_HEIGHT - GROUND_HEIGHT - h, 36, h);
      }

      // 4. Vẽ Các cặp ống (Pipes)
      pipesRef.current.forEach((pipe) => {
        const topPipeH = pipe.gapY - pipe.gapHeight / 2;
        const bottomPipeY = pipe.gapY + pipe.gapHeight / 2;
        const bottomPipeH = CANVAS_HEIGHT - GROUND_HEIGHT - bottomPipeY;

        // Vẽ Ống trên
        drawPipe(ctx, pipe.x, 0, PIPE_WIDTH, topPipeH, true);

        // Vẽ Ống dưới
        drawPipe(ctx, pipe.x, bottomPipeY, PIPE_WIDTH, bottomPipeH, false);
      });

      // 5. Vẽ Nền đất (Ground)
      const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
      // Thảm cỏ xanh phía trên
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, groundY, CANVAS_WIDTH, 14);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, groundY + 14, CANVAS_WIDTH, 4);

      // Nền cát vàng sẫm phía dưới
      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, groundY + 18, CANVAS_WIDTH, GROUND_HEIGHT - 18);

      // Họa tiết vạch sọc cổ điển di chuyển
      ctx.fillStyle = '#b45309';
      for (let x = -groundOffsetRef.current; x < CANVAS_WIDTH + 24; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, groundY + 18);
        ctx.lineTo(x + 12, groundY + 18);
        ctx.lineTo(x, groundY + GROUND_HEIGHT);
        ctx.lineTo(x - 12, groundY + GROUND_HEIGHT);
        ctx.closePath();
        ctx.fill();
      }

      // 6. Vẽ Con Chim với ĐẦU CẮT TỪ ẢNH CỦA NGƯỜI CHƠI
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(bird.rotation);

      // THÂN CHIM (Vàng tròn mập dễ thương)
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2.5;

      // Đuôi chim ở phía sau
      ctx.beginPath();
      ctx.moveTo(-14, -2);
      ctx.lineTo(-24, -8);
      ctx.lineTo(-20, 2);
      ctx.lineTo(-24, 8);
      ctx.lineTo(-14, 4);
      ctx.closePath();
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.stroke();

      // Bụng chim
      ctx.beginPath();
      ctx.ellipse(-2, 2, 17, 13, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15';
      ctx.fill();
      ctx.stroke();

      // Mảng lông bụng sáng màu
      ctx.beginPath();
      ctx.ellipse(-2, 6, 11, 7, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.fill();

      // Cánh chim vỗ lên/xuống theo nhịp
      ctx.save();
      const wingOffsets = [-6, 0, 6];
      const wingY = wingOffsets[bird.flapFrame];
      ctx.translate(-5, wingY);
      ctx.beginPath();
      ctx.ellipse(-2, 0, 10, 6, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // GẮN ĐẦU TỪ HÌNH ẢNH CỦA NGƯỜI DÙNG (Cắt tròn, cân đối tại vị trí đầu chim)
      const headCanvas = headCanvasRef.current;
      if (headCanvas) {
        // Kích thước đầu vừa vặn tỉ lệ với thân chim (đường kính 38px)
        const headSize = 38;
        const headX = 6 - headSize / 2;
        const headY = -6 - headSize / 2;

        ctx.drawImage(headCanvas, headX, headY, headSize, headSize);
      } else {
        // Dự phòng nếu ảnh chưa load kịp: vẽ đầu chim tròn tiêu chuẩn
        ctx.beginPath();
        ctx.arc(8, -6, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#facc15';
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();

      // 7. Hiển thị Điểm số lớn ở giữa đỉnh màn hình trong khi chơi
      if (state === 'playing') {
        ctx.save();
        ctx.font = '900 36px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(scoreRef.current.toString(), CANVAS_WIDTH / 2 + 2, 68);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(scoreRef.current.toString(), CANVAS_WIDTH / 2, 66);
        ctx.restore();
      }

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [bestScore]);

  // Hàm vẽ ống với hiệu ứng 3D đổ bóng retro
  const drawPipe = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isTop: boolean
  ) => {
    if (height <= 0) return;

    ctx.save();

    // Thân ống
    const bodyGradient = ctx.createLinearGradient(x, 0, x + width, 0);
    bodyGradient.addColorStop(0, '#15803d');
    bodyGradient.addColorStop(0.25, '#4ade80');
    bodyGradient.addColorStop(0.5, '#22c55e');
    bodyGradient.addColorStop(0.85, '#16a34a');
    bodyGradient.addColorStop(1, '#14532d');

    ctx.fillStyle = bodyGradient;
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 2.5;

    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);

    // Gờ mũ ống (Pipe Cap)
    const capX = x - (PIPE_CAP_WIDTH - width) / 2;
    const capY = isTop ? y + height - PIPE_CAP_HEIGHT : y;

    const capGradient = ctx.createLinearGradient(capX, 0, capX + PIPE_CAP_WIDTH, 0);
    capGradient.addColorStop(0, '#166534');
    capGradient.addColorStop(0.2, '#86efac');
    capGradient.addColorStop(0.5, '#22c55e');
    capGradient.addColorStop(0.85, '#15803d');
    capGradient.addColorStop(1, '#052e16');

    ctx.fillStyle = capGradient;
    ctx.fillRect(capX, capY, PIPE_CAP_WIDTH, PIPE_CAP_HEIGHT);
    ctx.strokeRect(capX, capY, PIPE_CAP_WIDTH, PIPE_CAP_HEIGHT);

    ctx.restore();
  };

  // Xác định huy chương theo mốc điểm
  const getMedal = (pts: number) => {
    if (pts >= 40) return { name: 'Bạch Kim', icon: '🏆', color: 'from-cyan-400 to-blue-500' };
    if (pts >= 30) return { name: 'Vàng', icon: '🥇', color: 'from-amber-400 to-yellow-500' };
    if (pts >= 20) return { name: 'Bạc', icon: '🥈', color: 'from-slate-300 to-slate-400' };
    if (pts >= 10) return { name: 'Đồng', icon: '🥉', color: 'from-amber-600 to-amber-800' };
    return null;
  };

  const medal = getMedal(score);

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center select-none overflow-hidden text-slate-100 relative">
      {/* THANH ĐIỀU KHIỂN TRÊN ĐẦU */}
      <header className="absolute top-3 left-4 right-4 z-30 flex items-center justify-between max-w-lg mx-auto">
        <button
          type="button"
          onClick={onBackToLobby}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold shadow-lg transition-all cursor-pointer backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Về Menu chính</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Kỷ lục */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-bold text-amber-300 backdrop-blur-md shadow-lg">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span>Kỷ lục: {bestScore}</span>
          </div>

          {/* Âm thanh */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-all cursor-pointer shadow-lg backdrop-blur-md ${
              soundEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:bg-slate-800 text-sky-300 cursor-pointer shadow-lg backdrop-blur-md"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* KHUNG ARCADE CHỨA CANVAS GAME */}
      <div className="relative rounded-3xl overflow-hidden border-4 border-slate-800 shadow-[0_0_50px_rgba(56,189,248,0.25)] bg-slate-900 cursor-pointer">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleJump}
          className="block"
        />

        {/* MÀN HÌNH CHỜ (IDLE) */}
        {gameState === 'idle' && (
          <div
            onClick={handleJump}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 cursor-pointer"
          >
            <div className="space-y-3 animate-pulse">
              <h1 className="text-2xl font-black font-arcade text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-400 to-pink-400 drop-shadow-md">
                FLAPPY PHUONG
              </h1>
              <p className="text-xs font-bold text-amber-200 tracking-wider">
                CHẠM HOẶC BẤM SPACE ĐỂ BAY
              </p>
            </div>

            <div className="mt-8 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-700 text-[11px] text-slate-300 font-semibold shadow-inner">
              Tránh các đường ống và ghi điểm cao nhé!
            </div>
          </div>
        )}

        {/* BẢNG ĐIỂM GAME OVER */}
        {gameState === 'game_over' && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fadeIn">
            <div className="w-full max-w-[290px] bg-slate-900/95 border-2 border-slate-700 rounded-3xl p-5 shadow-2xl text-center space-y-4">
              <h2 className="text-lg font-black font-arcade text-rose-400 tracking-wide">
                GAME OVER
              </h2>

              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-bold text-slate-400">ĐIỂM:</span>
                  <span className="text-xl font-black text-amber-300 font-arcade">{score}</span>
                </div>

                <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold text-slate-400">KỶ LỤC:</span>
                  <div className="flex items-center gap-1.5">
                    {isNewBest && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500 text-slate-950 font-black text-[9px] animate-bounce">
                        MỚI!
                      </span>
                    )}
                    <span className="text-base font-black text-white font-arcade">{bestScore}</span>
                  </div>
                </div>

                {/* Huy chương */}
                {medal && (
                  <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-800 text-xs">
                    <span className="font-bold text-slate-400">HUY CHƯƠNG:</span>
                    <span
                      className={`font-black flex items-center gap-1 bg-gradient-to-r ${medal.color} bg-clip-text text-transparent`}
                    >
                      <span>{medal.icon}</span>
                      <span>{medal.name}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Nút chơi lại */}
              <button
                type="button"
                onClick={resetGame}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>CHƠI LẠI</span>
              </button>

              <p className="text-[10px] text-slate-500 font-semibold">
                (Hoặc bấm phím SPACE để chơi tiếp)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER HƯỚNG DẪN */}
      <footer className="mt-4 text-center text-slate-500 text-xs font-medium">
        Bấm chuột hoặc phím <kbd className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">SPACE</kbd> để nhảy
      </footer>
    </div>
  );
};
