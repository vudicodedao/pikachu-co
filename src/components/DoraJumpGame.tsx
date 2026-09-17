import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Music,
  RotateCcw,
  Maximize,
  Minimize,
  Trophy,
  Sparkles,
  Zap,
  Pause,
  Play,
  Rocket,
  Heart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { doraSound } from '../core/doraSound';
import { DoraemonAvatar } from './DoraemonAvatar';
import { LeaderboardModal } from './LeaderboardModal';
import {
  getLeaderboard,
  saveLeaderboardEntry,
  clearLeaderboard,
  DORAJUMP_LEADERBOARD_KEY,
} from '../utils/leaderboard';
import { haptics } from '../utils/haptics';

interface DoraJumpGameProps {
  onBackToLobby: () => void;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 640;

const GRAVITY = 0.38;
const JUMP_IMPULSE = -11.2;
const SPRING_IMPULSE = -17.0;
const BOOST_IMPULSE = -18.5;
const HORIZONTAL_SPEED = 6.4;

type PlatformType = 'normal' | 'moving' | 'fragile' | 'spring';
type ItemType = 'dorayaki' | 'door' | 'small_light';

interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  vx?: number;
  broken?: boolean;
  item?: ItemType;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  alpha: number;
  color: string;
}

export const DoraJumpGame: React.FC<DoraJumpGameProps> = ({ onBackToLobby }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trạng thái Game
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'game_over'>('idle');
  const [heightScore, setHeightScore] = useState(0);
  const [bestHeight, setBestHeight] = useState(() => {
    return Number(localStorage.getItem('phuong_dorajump_best') || 0);
  });
  const [dorayakiCount, setDorayakiCount] = useState(0);
  const [copterEnergy, setCopterEnergy] = useState(0); // 0 - 100%
  const [isNewBest, setIsNewBest] = useState(false);

  // Âm thanh
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Bảng xếp hạng
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState(() => getLeaderboard(DORAJUMP_LEADERBOARD_KEY));
  const sessionStartTimeRef = useRef(Date.now());

  // Head Canvas pre-processed avatar
  const headCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game Engine Refs
  const playerRef = useRef({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 120,
    vx: 0,
    vy: 0,
    width: 44,
    height: 52,
    facing: 'right' as 'left' | 'right',
    scale: 1,
    smallLightTimer: 0,
    isBoosting: false,
    boostTimer: 0,
    copterAngle: 0,
  });

  const cameraYRef = useRef(0);
  const platformsRef = useRef<Platform[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const keysDownRef = useRef<{ [key: string]: boolean }>({});
  const touchTargetXRef = useRef<number | null>(null);
  const nextPlatformIdRef = useRef(1);
  const highestPlatformYRef = useRef(CANVAS_HEIGHT);
  const animationFrameIdRef = useRef<number | null>(null);
  const gameStateRef = useRef<'idle' | 'playing' | 'paused' | 'game_over'>('idle');
  const maxScoreRef = useRef(0);

  // Đồng bộ gameStateRef
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Đồng bộ âm thanh
  useEffect(() => {
    doraSound.sfxEnabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    doraSound.setBgmEnabled(bgmEnabled);
    return () => doraSound.stopBgm();
  }, [bgmEnabled]);

  // Pre-crop head image into circular avatar
  useEffect(() => {
    const img = new Image();
    img.src = './flappy-face.jpg';
    img.onload = () => {
      const hCanvas = document.createElement('canvas');
      hCanvas.width = 90;
      hCanvas.height = 90;
      const hCtx = hCanvas.getContext('2d')!;

      // Cắt tròn tập trung khuôn mặt
      hCtx.save();
      hCtx.beginPath();
      hCtx.ellipse(45, 38, 34, 34, 0, 0, Math.PI * 2);
      hCtx.clip();
      hCtx.drawImage(img, 0, 0, 90, 90);
      hCtx.restore();

      // Viền vàng bảo bối
      hCtx.save();
      hCtx.beginPath();
      hCtx.ellipse(45, 38, 34, 34, 0, 0, Math.PI * 2);
      hCtx.lineWidth = 3.5;
      hCtx.strokeStyle = '#facc15';
      hCtx.stroke();
      hCtx.restore();

      headCanvasRef.current = hCanvas;
    };
  }, []);

  // Toàn màn hình
  const toggleFullscreen = () => {
    haptics.tap();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Tạo bệ đỡ ban đầu & tiến trình tạo thêm bệ khi leo cao
  const createPlatform = (y: number, forceNormal = false): Platform => {
    const id = nextPlatformIdRef.current++;
    const width = 64 + Math.random() * 24;
    const height = 15;
    const x = Math.random() * (CANVAS_WIDTH - width - 20) + 10;

    let type: PlatformType = 'normal';
    let vx = 0;
    let item: ItemType | undefined = undefined;

    if (!forceNormal) {
      const rand = Math.random();
      if (rand < 0.22) {
        type = 'moving';
        vx = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 1.5);
      } else if (rand < 0.38) {
        type = 'fragile';
      } else if (rand < 0.5) {
        type = 'spring';
      }

      // Tỉ lệ xuất hiện bảo bối trên bệ (không gắn trên bệ vỡ)
      if (type !== 'fragile') {
        const itemRand = Math.random();
        if (itemRand < 0.18) {
          item = 'dorayaki';
        } else if (itemRand < 0.22) {
          item = 'door';
        } else if (itemRand < 0.26) {
          item = 'small_light';
        }
      }
    }

    return { id, x, y, width, height, type, vx, item };
  };

  // Khởi tạo bàn chơi mới
  const initGame = useCallback(() => {
    playerRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 120,
      vx: 0,
      vy: JUMP_IMPULSE,
      width: 44,
      height: 52,
      facing: 'right',
      scale: 1,
      smallLightTimer: 0,
      isBoosting: false,
      boostTimer: 0,
      copterAngle: 0,
    };

    cameraYRef.current = 0;
    particlesRef.current = [];
    floatingTextsRef.current = [];
    nextPlatformIdRef.current = 1;
    maxScoreRef.current = 0;

    // Bệ xuất phát ngay dưới chân
    const initialPlatforms: Platform[] = [
      {
        id: nextPlatformIdRef.current++,
        x: CANVAS_WIDTH / 2 - 45,
        y: CANVAS_HEIGHT - 60,
        width: 90,
        height: 16,
        type: 'normal',
      },
    ];

    // Sinh 12 bệ liên tiếp phía trên
    let currentY = CANVAS_HEIGHT - 130;
    for (let i = 0; i < 11; i++) {
      initialPlatforms.push(createPlatform(currentY, i < 3));
      currentY -= 55 + Math.random() * 30;
    }

    platformsRef.current = initialPlatforms;
    highestPlatformYRef.current = currentY;

    setHeightScore(0);
    setDorayakiCount(0);
    setCopterEnergy(20);
    setIsNewBest(false);
    sessionStartTimeRef.current = Date.now();
  }, []);

  // Bắt đầu chơi
  const handleStartGame = () => {
    haptics.tap();
    initGame();
    setGameState('playing');
    doraSound.playJump();
    doraSound.startBgm();
  };

  // Kích hoạt Chong chóng tre siêu tốc (Rocket Boost)
  const triggerCopterBoost = () => {
    if (copterEnergy < 100 || playerRef.current.isBoosting) return;
    haptics.heavy();
    doraSound.playBoost();

    playerRef.current.isBoosting = true;
    playerRef.current.boostTimer = 150; // 2.5 giây ở 60fps
    playerRef.current.vy = BOOST_IMPULSE;
    setCopterEnergy(0);

    // Bắn pháo giấy nhẹ ăn mừng kích hoạt
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#38bdf8', '#facc15', '#f43f5e'],
    });
  };

  // Thêm hiệu ứng hạt nổ lấp lánh
  const addParticles = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
        size: 2.5 + Math.random() * 3.5,
      });
    }
  };

  // Thêm chữ bay thông báo thưởng
  const addFloatingText = (text: string, x: number, y: number, color = '#facc15') => {
    floatingTextsRef.current.push({
      id: Math.random(),
      text,
      x,
      y,
      alpha: 1,
      color,
    });
  };

  // Vòng lặp vật lý chính
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      animationFrameIdRef.current = requestAnimationFrame(loop);

      if (gameStateRef.current !== 'playing') {
        // Vẫn vẽ frame nền tĩnh hoặc chờ
        return;
      }

      const player = playerRef.current;
      const cameraY = cameraYRef.current;

      // 1. Cập nhật di chuyển ngang (Bàn phím & Cảm ứng)
      let moveDir = 0;
      if (keysDownRef.current['ArrowLeft'] || keysDownRef.current['KeyA']) {
        moveDir -= 1;
      }
      if (keysDownRef.current['ArrowRight'] || keysDownRef.current['KeyD']) {
        moveDir += 1;
      }

      // Xử lý touch drag
      if (touchTargetXRef.current !== null) {
        const diff = touchTargetXRef.current - player.x;
        if (Math.abs(diff) > 8) {
          moveDir = diff > 0 ? 1 : -1;
        }
      }

      if (moveDir !== 0) {
        player.vx = moveDir * HORIZONTAL_SPEED;
        player.facing = moveDir > 0 ? 'right' : 'left';
      } else {
        player.vx *= 0.82; // ma sát chậm dần
      }

      player.x += player.vx;

      // Xuyên màn hình trái <-> phải (Screen Wrap)
      if (player.x < -player.width / 2) {
        player.x = CANVAS_WIDTH + player.width / 2;
      } else if (player.x > CANVAS_WIDTH + player.width / 2) {
        player.x = -player.width / 2;
      }

      // 2. Cập nhật trạng thái Chong chóng tre Boost
      if (player.isBoosting) {
        player.boostTimer--;
        player.vy = BOOST_IMPULSE;
        player.copterAngle += 0.45;

        // Sinh hạt đuôi sao lấp lánh khi bay siêu tốc
        if (Math.random() < 0.6) {
          addParticles(player.x, player.y + 25, '#38bdf8', 2);
          addParticles(player.x, player.y + 25, '#facc15', 2);
        }

        if (player.boostTimer <= 0) {
          player.isBoosting = false;
          player.vy = JUMP_IMPULSE * 0.8;
        }
      } else {
        // Trọng lực thường
        player.vy += GRAVITY;
        player.copterAngle += Math.abs(player.vy) * 0.04 + 0.1;
      }

      player.y += player.vy;

      // 3. Hiệu ứng Đèn pin thu nhỏ
      if (player.smallLightTimer > 0) {
        player.smallLightTimer--;
        player.scale = 0.65;
        if (player.smallLightTimer <= 0) {
          player.scale = 1.0;
        }
      }

      // 4. Kiểm tra va chạm Bệ đỡ (Chỉ khi đang rơi xuống `vy > 0`)
      if (player.vy > 0 && !player.isBoosting) {
        const footY = player.y + (player.height * player.scale) / 2;
        const prevFootY = footY - player.vy;
        const playerHalfW = (player.width * player.scale) * 0.4;

        for (const plat of platformsRef.current) {
          if (plat.broken) continue;

          // Chân cắt qua mặt trên bệ đỡ
          if (
            prevFootY <= plat.y + 4 &&
            footY >= plat.y - 4 &&
            player.x + playerHalfW >= plat.x &&
            player.x - playerHalfW <= plat.x + plat.width
          ) {
            haptics.tap();

            // Xử lý các loại bệ
            if (plat.type === 'spring') {
              player.vy = SPRING_IMPULSE;
              doraSound.playSpring();
              addParticles(player.x, plat.y, '#facc15', 10);
              addFloatingText('BẬT CAO!', player.x, plat.y - 10, '#facc15');
            } else if (plat.type === 'fragile') {
              plat.broken = true;
              player.vy = JUMP_IMPULSE * 0.9;
              doraSound.playJump();
              addParticles(plat.x + plat.width / 2, plat.y, '#94a3b8', 12);
            } else {
              player.vy = JUMP_IMPULSE;
              doraSound.playJump();
              addParticles(player.x, plat.y, '#38bdf8', 6);
            }

            break;
          }
        }
      }

      // 5. Kiểm tra lụm Bảo bối (Dorayaki, Cánh cửa thần kỳ, Đèn pin)
      for (const plat of platformsRef.current) {
        if (plat.item && !plat.broken) {
          const itemX = plat.x + plat.width / 2;
          const itemY = plat.y - 18;
          const dist = Math.hypot(player.x - itemX, player.y - itemY);

          if (dist < 32) {
            haptics.medium();
            if (plat.item === 'dorayaki') {
              doraSound.playDorayaki();
              setDorayakiCount((prev) => prev + 1);
              setCopterEnergy((prev) => Math.min(100, prev + 25));
              addParticles(itemX, itemY, '#f59e0b', 12);
              addFloatingText('+100m Bánh Rán', itemX, itemY, '#f59e0b');
              cameraYRef.current -= 40; // thưởng tiến thêm 40px
            } else if (plat.item === 'door') {
              doraSound.playDoorWarp();
              addParticles(itemX, itemY, '#ec4899', 24);
              addFloatingText('CỬA THẦN KỲ! +400m', itemX, itemY, '#ec4899');
              cameraYRef.current -= 400; // Warp nhảy cóc 400m
              player.y -= 380;
              player.vy = JUMP_IMPULSE;
            } else if (plat.item === 'small_light') {
              doraSound.playSmallLight();
              player.smallLightTimer = 360; // 6 giây
              addParticles(itemX, itemY, '#38bdf8', 15);
              addFloatingText('THU NHỎ 6S!', itemX, itemY, '#38bdf8');
            }
            plat.item = undefined; // đã lụm
          }
        }
      }

      // 6. Cập nhật vị trí bệ di chuyển (Moving platform)
      for (const plat of platformsRef.current) {
        if (plat.type === 'moving' && plat.vx) {
          plat.x += plat.vx;
          if (plat.x <= 10) {
            plat.x = 10;
            plat.vx *= -1;
          } else if (plat.x + plat.width >= CANVAS_WIDTH - 10) {
            plat.x = CANVAS_WIDTH - 10 - plat.width;
            plat.vx *= -1;
          }
        }
      }

      // 7. Cuộn Camera theo chiều cao đạt được
      const targetCameraY = player.y - CANVAS_HEIGHT * 0.45;
      if (targetCameraY < cameraYRef.current) {
        cameraYRef.current = targetCameraY;
      }

      // Cập nhật điểm số độ cao (mét)
      const currentMeters = Math.max(0, Math.floor(-cameraYRef.current / 6));
      if (currentMeters > maxScoreRef.current) {
        maxScoreRef.current = currentMeters;
        setHeightScore(currentMeters);
        // Tích tụ năng lượng chong chóng tre từ từ khi leo
        setCopterEnergy((prev) => Math.min(100, prev + 0.05));
      }

      // 8. Xóa bệ cũ phía dưới và sinh thêm bệ mới liên tục phía trên
      platformsRef.current = platformsRef.current.filter(
        (p) => p.y < cameraYRef.current + CANVAS_HEIGHT + 80
      );

      while (highestPlatformYRef.current > cameraYRef.current - 120) {
        highestPlatformYRef.current -= 55 + Math.random() * 32;
        platformsRef.current.push(createPlatform(highestPlatformYRef.current));
      }

      // 9. Cập nhật hiệu ứng hạt & chữ bay
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;
        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y -= 1.2;
        ft.alpha -= 0.02;
        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(i, 1);
        }
      }

      // 10. Kiểm tra Game Over (Rơi khỏi mép dưới camera)
      if (player.y > cameraYRef.current + CANVAS_HEIGHT + 40 && !player.isBoosting) {
        haptics.error();
        doraSound.playFall();
        doraSound.stopBgm();

        const finalScore = maxScoreRef.current;
        if (finalScore > bestHeight) {
          setBestHeight(finalScore);
          localStorage.setItem('phuong_dorajump_best', finalScore.toString());
          setIsNewBest(true);
        }

        // Lưu kỷ lục Leaderboard
        const timeSpent = Math.max(1, Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
        const updated = saveLeaderboardEntry(
          {
            score: finalScore,
            stageReached: Math.floor(finalScore / 500) + 1,
            timeSpentSeconds: timeSpent,
          },
          DORAJUMP_LEADERBOARD_KEY
        );
        setLeaderboard(updated);

        setGameState('game_over');
        return;
      }

      // ==========================
      // 11. RENDER ĐỒ HỌA TRÊN CANVAS
      // ==========================
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // A. Vẽ nền Parallax chuyển màu theo độ cao
      const altitude = maxScoreRef.current;
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      if (altitude < 800) {
        // Tầng 1: Trời xanh mây trắng
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(1, '#bae6fd');
      } else if (altitude < 2500) {
        // Tầng 2: Hoàng hôn hồng cam tím
        grad.addColorStop(0, '#4c1d95');
        grad.addColorStop(0.5, '#db2777');
        grad.addColorStop(1, '#fb923c');
      } else {
        // Tầng 3: Vũ trụ sâu thẳm đầy sao
        grad.addColorStop(0, '#030712');
        grad.addColorStop(0.6, '#0f172a');
        grad.addColorStop(1, '#1e1b4b');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Vẽ sao vũ trụ nếu ở tầng cao
      if (altitude > 1500) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        for (let s = 0; s < 25; s++) {
          const starX = (s * 47) % CANVAS_WIDTH;
          const starY = ((s * 73 - cameraY * 0.15) % CANVAS_HEIGHT + CANVAS_HEIGHT) % CANVAS_HEIGHT;
          ctx.beginPath();
          ctx.arc(starX, starY, (s % 3) + 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.save();
      // Dịch chuyển thế giới theo Camera
      ctx.translate(0, -cameraY);

      // B. Vẽ các bệ đỡ (Platforms)
      for (const plat of platformsRef.current) {
        if (plat.broken) continue;

        ctx.save();
        if (plat.type === 'normal') {
          // Bệ mây xanh trắng dễ thương
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 8);
          ctx.fill();
          // Viền trên màu xanh Doraemon
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(plat.x + 3, plat.y, plat.width - 6, 3.5);
        } else if (plat.type === 'moving') {
          // Bệ mây di chuyển (viền xanh lá)
          ctx.fillStyle = '#f0fdf4';
          ctx.beginPath();
          ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 8);
          ctx.fill();
          ctx.fillStyle = '#10b981';
          ctx.fillRect(plat.x + 3, plat.y, plat.width - 6, 4);
        } else if (plat.type === 'fragile') {
          // Bệ mây vỡ nát (màu xám có vết nứt)
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 8);
          ctx.fill();
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(plat.x + 10, plat.y + 4);
          ctx.lineTo(plat.x + plat.width / 2, plat.y + plat.height - 3);
          ctx.lineTo(plat.x + plat.width - 12, plat.y + 5);
          ctx.stroke();
        } else if (plat.type === 'spring') {
          // Bệ lò xo bánh đà màu vàng
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 8);
          ctx.fill();
          ctx.fillStyle = '#eab308';
          ctx.fillRect(plat.x + 4, plat.y, plat.width - 8, 4);
          // Lò xo xoắn ở giữa
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(plat.x + plat.width / 2, plat.y - 4, 6, 0, Math.PI);
          ctx.stroke();
        }

        // Vẽ Bảo bối trên bệ nếu có
        if (plat.item) {
          const itemX = plat.x + plat.width / 2;
          const itemY = plat.y - 14;

          if (plat.item === 'dorayaki') {
            // Bánh rán Dorayaki vàng ươm
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.ellipse(itemX, itemY, 13, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            // Lớp nhân đậu đỏ viền giữa
            ctx.fillStyle = '#78350f';
            ctx.fillRect(itemX - 10, itemY - 1.5, 20, 3);
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.ellipse(itemX, itemY - 2, 11, 7, 0, 0, Math.PI * 2);
            ctx.fill();
          } else if (plat.item === 'door') {
            // Cánh cửa thần kỳ hồng phấn
            ctx.fillStyle = '#ec4899';
            ctx.fillRect(itemX - 8, itemY - 14, 16, 22);
            ctx.strokeStyle = '#be185d';
            ctx.lineWidth = 2;
            ctx.strokeRect(itemX - 8, itemY - 14, 16, 22);
            // Nắm đấm cửa vàng
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(itemX + 4, itemY - 3, 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (plat.item === 'small_light') {
            // Đèn pin thu nhỏ
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(itemX - 4, itemY - 10, 8, 14);
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.moveTo(itemX - 7, itemY - 10);
            ctx.lineTo(itemX + 7, itemY - 10);
            ctx.lineTo(itemX + 4, itemY - 4);
            ctx.lineTo(itemX - 4, itemY - 4);
            ctx.closePath();
            ctx.fill();
          }
        }

        ctx.restore();
      }

      // C. Vẽ Nhân vật Mèo Máy Doraemon
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.scale(player.scale, player.scale);

      const isLeft = player.facing === 'left';
      if (isLeft) {
        ctx.scale(-1, 1);
      }

      // 1. Thân tròn Doraemon xanh lam
      ctx.fillStyle = '#0284c7';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.ellipse(0, 10, 18, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Bụng trắng & Túi thần kỳ
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 11, 12, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 10, 8, 0, Math.PI);
      ctx.closePath();
      ctx.stroke();

      // Vòng cổ đỏ & Quả chuông vàng
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(-12, -2, 24, 4);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 4, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 2. Đầu mèo máy (Ảnh bạn gái cắt tròn)
      if (headCanvasRef.current) {
        ctx.drawImage(headCanvasRef.current, -20, -32, 40, 40);
      } else {
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(0, -12, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Chong chóng tre trên đỉnh đầu
      ctx.save();
      ctx.translate(0, -34);
      // Trục vàng
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-1.5, 0, 3, 7);
      // Hai cánh quạt xoay tít theo copterAngle
      const bladeW = Math.cos(player.copterAngle) * 22;
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.abs(bladeW), 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      // D. Vẽ các hạt lấp lánh (Particles)
      for (const p of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // E. Vẽ chữ nổi thông báo thưởng (Floating Text)
      for (const ft of floatingTextsRef.current) {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = ft.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      ctx.restore(); // Hết translate Camera
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [bestHeight]);

  // Xử lý sự kiện bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDownRef.current[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameStateRef.current === 'idle') {
          handleStartGame();
        } else if (gameStateRef.current === 'playing') {
          triggerCopterBoost();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="w-screen min-h-dvh h-dvh bg-slate-950 text-slate-100 flex flex-col justify-between items-center select-none overflow-hidden relative overscroll-none">
      {/* 1. HEADER CÔNG CỤ ĐIỀU KHIỂN ARCADE */}
      <header className="shrink-0 w-full max-w-lg bg-slate-900/95 border-b border-slate-800 px-3 py-2 flex items-center justify-between z-30 backdrop-blur-md">
        {/* Nút Về sảnh */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              doraSound.stopBgm();
              onBackToLobby();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Sảnh</span>
          </button>

          {/* Độ cao hiện tại */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 rounded-xl border border-slate-800 font-arcade text-xs text-sky-400 font-bold">
            <Rocket className="w-3.5 h-3.5 text-sky-400" />
            <span>{heightScore}m</span>
          </div>
        </div>

        {/* Số bánh rán & Kỷ lục */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold text-amber-300">
            <span>🍩</span>
            <span>{dorayakiCount}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold text-yellow-400">
            <Trophy className="w-3.5 h-3.5" />
            <span>{bestHeight}m</span>
          </div>
        </div>

        {/* Cụm nút tiện ích */}
        <div className="flex items-center gap-1.5">
          {/* Âm thanh BGM */}
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              setBgmEnabled(!bgmEnabled);
            }}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              bgmEnabled
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title={bgmEnabled ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
          >
            <Music className="w-4 h-4" />
          </button>

          {/* Âm thanh SFX */}
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              setSoundEnabled(!soundEnabled);
            }}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title={soundEnabled ? 'Tắt tiếng hiệu ứng' : 'Bật tiếng hiệu ứng'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Bảng kỷ lục */}
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              setIsLeaderboardOpen(true);
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 cursor-pointer transition-all active:scale-95"
            title="Bảng xếp hạng"
          >
            <Trophy className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 cursor-pointer transition-all active:scale-95"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. KHU VỰC CHƠI GAME CANVAS */}
      <main className="flex-1 w-full flex items-center justify-center p-0 overflow-hidden relative">
        <div
          className="relative rounded-3xl overflow-hidden border-2 sm:border-4 border-slate-800 shadow-[0_0_50px_rgba(56,189,248,0.25)] bg-slate-900 max-w-full max-h-[calc(100dvh-75px)] aspect-[400/640] flex items-center justify-center touch-none"
          onTouchStart={(e) => {
            const touch = e.touches[0];
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
            touchTargetXRef.current = relX;
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
            touchTargetXRef.current = relX;
          }}
          onTouchEnd={() => {
            touchTargetXRef.current = null;
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full object-contain block touch-none"
          />

          {/* THANH NĂNG LƯỢNG CHONG CHÓNG TRE Ở CẠNH DƯỚI CANVAS */}
          <div className="absolute bottom-3 inset-x-4 flex items-center justify-between gap-3 pointer-events-none z-20">
            {/* Thanh tiến trình năng lượng */}
            <div className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-2xl p-1.5 backdrop-blur-md shadow-lg flex items-center gap-2">
              <span className="text-[10px] font-black text-amber-300 uppercase tracking-wide shrink-0">
                🚀 Chong chóng
              </span>
              <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    copterEnergy >= 100
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 animate-pulse'
                      : 'bg-gradient-to-r from-sky-500 to-blue-500'
                  }`}
                  style={{ width: `${copterEnergy}%` }}
                />
              </div>
            </div>

            {/* Nút bấm Kích hoạt Chong Chóng Tre */}
            <button
              type="button"
              disabled={copterEnergy < 100}
              onClick={triggerCopterBoost}
              className={`px-3 py-2 rounded-2xl text-xs font-black font-arcade transition-all pointer-events-auto flex items-center gap-1.5 shadow-xl ${
                copterEnergy >= 100
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 hover:scale-105 active:scale-90 cursor-pointer animate-bounce shadow-amber-400/50'
                  : 'bg-slate-800/80 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <span>BAY!</span>
            </button>
          </div>

          {/* CẶP PHÍM ĐIỀU KHIỂN LIQUID GLASS CHO MOBILE */}
          <div className="lg:hidden absolute bottom-14 inset-x-4 flex justify-between pointer-events-none z-20">
            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                haptics.tap();
                keysDownRef.current['ArrowLeft'] = true;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                keysDownRef.current['ArrowLeft'] = false;
              }}
              onMouseDown={() => {
                keysDownRef.current['ArrowLeft'] = true;
              }}
              onMouseUp={() => {
                keysDownRef.current['ArrowLeft'] = false;
              }}
              className="w-14 h-14 rounded-2xl liquid-glass-btn flex items-center justify-center pointer-events-auto active:scale-85 active:bg-sky-500/40 active:border-sky-300 select-none cursor-pointer"
            >
              <ChevronLeft className="w-8 h-8 text-white drop-shadow stroke-[3]" />
            </button>

            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                haptics.tap();
                keysDownRef.current['ArrowRight'] = true;
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                keysDownRef.current['ArrowRight'] = false;
              }}
              onMouseDown={() => {
                keysDownRef.current['ArrowRight'] = true;
              }}
              onMouseUp={() => {
                keysDownRef.current['ArrowRight'] = false;
              }}
              className="w-14 h-14 rounded-2xl liquid-glass-btn flex items-center justify-center pointer-events-auto active:scale-85 active:bg-sky-500/40 active:border-sky-300 select-none cursor-pointer"
            >
              <ChevronRight className="w-8 h-8 text-white drop-shadow stroke-[3]" />
            </button>
          </div>

          {/* MÀN HÌNH CHỜ (IDLE) */}
          {gameState === 'idle' && (
            <div
              onClick={handleStartGame}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center cursor-pointer z-30 animate-fadeIn"
            >
              <div className="space-y-4 max-w-xs flex flex-col items-center">
                <DoraemonAvatar size={80} animate={true} />

                <div>
                  <h1 className="text-xl font-black font-arcade text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-sky-300 to-pink-300">
                    PHUONG DORAJUMP
                  </h1>
                  <p className="text-xs font-bold text-sky-200 mt-1">
                    Mèo Máy Chong Chóng Tre Leo Mây
                  </p>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-700 text-xs text-slate-300 space-y-1.5 shadow-inner">
                  <p>👉 Chạm trái/phải hoặc vuốt để bay sang hai bên</p>
                  <p>🍩 Ăn bánh rán để sạc đầy Chong chóng tre</p>
                  <p>🚪 Bước vào Cửa thần kỳ để nhảy cóc 400m!</p>
                </div>

                <button
                  type="button"
                  onClick={handleStartGame}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/40 transition-all cursor-pointer animate-pulse"
                >
                  <Rocket className="w-4 h-4" />
                  <span>CHẠM ĐỂ BẮT ĐẦU</span>
                </button>
              </div>
            </div>
          )}

          {/* MÀN HÌNH KẾT THÚC (GAME OVER) */}
          {gameState === 'game_over' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-fadeIn">
              <div className="bg-slate-900/95 border-2 border-slate-700 rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4">
                <div className="flex justify-center">
                  <DoraemonAvatar size={68} animate={false} />
                </div>

                <h2 className="text-lg font-black font-arcade text-rose-400">
                  RƠI KHỎI TẦNG MÂY!
                </h2>

                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-slate-400 font-bold">ĐỘ CAO:</span>
                    <span className="text-xl font-black text-amber-300 font-arcade">
                      {heightScore}m
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-800">
                    <span className="text-slate-400 font-bold">KỶ LỤC CAO NHẤT:</span>
                    <span className="text-sm font-black text-emerald-400 font-arcade">
                      {bestHeight}m
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-800">
                    <span className="text-slate-400 font-bold">BÁNH RÁN ĂN ĐƯỢC:</span>
                    <span className="text-sm font-black text-yellow-300 font-arcade">
                      {dorayakiCount} 🍩
                    </span>
                  </div>
                </div>

                {isNewBest && (
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 animate-bounce">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span>KỶ LỤC ĐỘ CAO MỚI!</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleStartGame}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>BAY LẠI NÀO</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    haptics.tap();
                    doraSound.stopBgm();
                    onBackToLobby();
                  }}
                  className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Quay về sảnh chọn game
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL BẢNG KỶ LỤC */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        entries={leaderboard}
        onClose={() => setIsLeaderboardOpen(false)}
        onClear={() => {
          clearLeaderboard(DORAJUMP_LEADERBOARD_KEY);
          setLeaderboard([]);
        }}
        title="Bảng kỷ lục Phuong DoraJump"
        subtitle="Hành trình bay lượn trên các tầng mây của Mèo Máy"
        scoreColumnLabel="Độ cao (Mét)"
        stageColumnLabel="Tầng Mây"
        stageBadgePrefix="Tầng"
      />
    </div>
  );
};
