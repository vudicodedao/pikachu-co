import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  Music,
  Sliders,
  RotateCcw,
  Maximize,
  Minimize,
  Heart,
  Zap,
  Sparkles,
  Trophy,
  Flame,
  Pause,
  Play,
  Magnet,
  Activity,
  Clock,
  Shield,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { catcherSound } from '../core/catcherSound';
import { getTilePhotoUrl, getAllCustomPhotos } from '../utils/photoStorage';
import { SuperheroAvatar } from './SuperheroAvatar';
import { LeaderboardModal } from './LeaderboardModal';
import {
  getLeaderboard,
  saveLeaderboardEntry,
  clearLeaderboard,
  CATCHER_LEADERBOARD_KEY,
} from '../utils/leaderboard';
import { haptics } from '../utils/haptics';

interface CatcherGameProps {
  onBackToLobby: () => void;
}

// Loại trừ ảnh 32, 33, 34 theo yêu cầu của người dùng
const EXCLUDED_PHOTO_IDS = [32, 33, 34];
const VALID_PHOTO_IDS = Array.from({ length: 36 }, (_, i) => i + 1).filter(
  (id) => !EXCLUDED_PHOTO_IDS.includes(id)
);

// Cấu hình các mốc điểm cho hình bạn gái (To nhỏ & Thưởng / Phạt)
interface PointTier {
  points: number;
  penalty: number;
  size: number;
  weight: number;
  label: string;
}

const POINT_TIERS: PointTier[] = [
  { points: 10, penalty: 3, size: 68, weight: 42, label: '+10' },
  { points: 20, penalty: 6, size: 60, weight: 26, label: '+20' },
  { points: 50, penalty: 15, size: 52, weight: 16, label: '+50' },
  { points: 100, penalty: 30, size: 45, weight: 9, label: '+100' },
  { points: 200, penalty: 80, size: 38, weight: 5, label: '+200' },
  { points: 500, penalty: 250, size: 32, weight: 2, label: '+500' },
];

type ItemType = 'photo' | 'heart' | 'magnet' | 'lightning';

interface FallingItem {
  id: number;
  type: ItemType;
  photoId?: number;
  tier?: PointTier;
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotSpeed: number;
  wobbleOffset: number;
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
  scale: number;
}

export const CatcherGame: React.FC<CatcherGameProps> = ({ onBackToLobby }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trạng thái game: Máu ban đầu là 100 và tăng lên khi lụm bóng
  const [hp, setHp] = useState(100);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [wave, setWave] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'game_over'>('playing');
  const [magnetTimeLeft, setMagnetTimeLeft] = useState(0);

  // Bảng xếp hạng & Kỷ lục
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState(() => getLeaderboard(CATCHER_LEADERBOARD_KEY));
  const [bestHp, setBestHp] = useState(() => {
    return Number(localStorage.getItem('phuong_catcher_best_hp') || 100);
  });
  const [isNewBest, setIsNewBest] = useState(false);

  // Âm thanh
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [bgmVolume, setBgmVolume] = useState(0.45);
  const [showVolumePop, setShowVolumePop] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Kho ảnh
  const [customPhotos, setCustomPhotos] = useState<Record<number, string>>({});
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const heroHeadImgRef = useRef<HTMLImageElement | null>(null);

  // Tọa độ người chơi & Physics
  const playerRef = useRef({
    x: 320,
    y: 720,
    width: 96,
    height: 94,
    vx: 0,
    speed: 520, // pixel/s di chuyển bàn phím
    lean: 0,
  });

  // Mảng vật phẩm và hiệu ứng
  const itemsRef = useRef<FallingItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const screenShakeRef = useRef(0);
  const keysDownRef = useRef<{ [key: string]: boolean }>({});
  const nextItemIdRef = useRef(1);
  const nextSpawnTimeRef = useRef(0);
  const magnetTimerRef = useRef(0);
  const sessionStartTimeRef = useRef(Date.now());
  const maxHpReachedRef = useRef(100);
  const targetTouchXRef = useRef<number | null>(null);

  // Refs DOM
  const volumeBtnRef = useRef<HTMLButtonElement | null>(null);
  const volumePopRef = useRef<HTMLDivElement | null>(null);

  // Load kho ảnh & preload ảnh hero
  useEffect(() => {
    getAllCustomPhotos().then((photos) => {
      setCustomPhotos(photos);
    });

    const heroImg = new Image();
    heroImg.src = './hero-face.jpg';
    heroImg.onload = () => {
      heroHeadImgRef.current = heroImg;
    };

    catcherSound.setBgmVolume(bgmVolume);
    catcherSound.setBgmEnabled(bgmEnabled);
    catcherSound.sfxEnabled = soundEnabled;

    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      catcherSound.stopBgm();
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  // Đồng hồ tính thời gian sống sót
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Xử lý đóng popover âm lượng
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

  // Cập nhật kỷ lục Máu cao nhất
  useEffect(() => {
    if (hp > bestHp) {
      setBestHp(hp);
      localStorage.setItem('phuong_catcher_best_hp', hp.toString());
      setIsNewBest(true);
    }
    if (hp > maxHpReachedRef.current) {
      maxHpReachedRef.current = hp;
    }
  }, [hp, bestHp]);

  // Ghi nhận bảng xếp hạng
  const recordLeaderboard = useCallback((finalHp: number, finalWave: number, duration: number) => {
    const updated = saveLeaderboardEntry(
      {
        score: finalHp,
        stageReached: finalWave,
        timeSpentSeconds: duration,
      },
      CATCHER_LEADERBOARD_KEY
    );
    setLeaderboard(updated);
  }, []);

  // Lấy hoặc tạo đối tượng Image trong cache
  const getPreloadedImage = useCallback(
    (src: string): HTMLImageElement | null => {
      const cache = imageCacheRef.current;
      if (cache.has(src)) {
        return cache.get(src)!;
      }
      const img = new Image();
      img.src = src;
      cache.set(src, img);
      return img;
    },
    []
  );

  // Thêm chữ nổi trên màn hình
  const addFloatingText = (text: string, x: number, y: number, color = '#10b981') => {
    floatingTextsRef.current.push({
      id: Math.random(),
      text,
      x,
      y,
      alpha: 1,
      color,
      scale: 1,
    });
  };

  // Nổ hạt pháo hoa
  const addParticles = (x: number, y: number, color = '#10b981', count = 14) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.5 + 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
        size: Math.random() * 4 + 3,
      });
    }
  };

  // Khởi động lại trận
  const handleRestart = () => {
    setHp(100);
    setLives(3);
    setCombo(0);
    setWave(1);
    setElapsedSeconds(0);
    setMagnetTimeLeft(0);
    setGameState('playing');
    setIsNewBest(false);

    itemsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    magnetTimerRef.current = 0;
    screenShakeRef.current = 0;
    sessionStartTimeRef.current = Date.now();
    maxHpReachedRef.current = 100;
    playerRef.current.x = 320;
    playerRef.current.vx = 0;

    catcherSound.startBgm();
  };

  // ĐIỀU KHIỂN: CHỈ DÙNG 2 PHÍM TRÁI / PHẢI
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setGameState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
        return;
      }
      keysDownRef.current[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Chọn ngẫu nhiên 1 mốc điểm theo trọng số
  const getRandomTier = (): PointTier => {
    const totalWeight = POINT_TIERS.reduce((sum, t) => sum + t.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const tier of POINT_TIERS) {
      if (rand < tier.weight) return tier;
      rand -= tier.weight;
    }
    return POINT_TIERS[0];
  };

  // VÒNG LẶP CHÍNH GAME CANVAS (60 FPS MƯỢT MÀ)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const width = canvas.width;
      const height = canvas.height;

      // Cập nhật vị trí người chơi
      const player = playerRef.current;
      player.y = height - 90;

      const isLeft = keysDownRef.current['ArrowLeft'] || keysDownRef.current['a'] || keysDownRef.current['A'];
      const isRight = keysDownRef.current['ArrowRight'] || keysDownRef.current['d'] || keysDownRef.current['D'];

      let moveDir = 0;
      if (isLeft) moveDir -= 1;
      if (isRight) moveDir += 1;

      // Di chuyển ngang mượt mà bằng bàn phím/nút ảo hoặc theo ngón tay chạm lướt
      if (moveDir !== 0) {
        player.vx = moveDir * player.speed;
        player.x += player.vx * dt;
        player.lean = moveDir * 0.15;
      } else if (targetTouchXRef.current !== null) {
        const targetX = targetTouchXRef.current;
        const diff = targetX - player.x;
        player.x += diff * Math.min(1, dt * 14);
        player.lean = Math.max(-0.25, Math.min(0.25, diff * 0.012));
      } else {
        player.vx = 0;
        player.lean = 0;
      }

      // Khóa vị trí trong khung chơi
      player.x = Math.max(player.width / 2 + 10, Math.min(width - player.width / 2 - 10, player.x));

      // Đếm ngược Nam châm
      if (magnetTimerRef.current > 0) {
        magnetTimerRef.current = Math.max(0, magnetTimerRef.current - dt);
        setMagnetTimeLeft(Math.ceil(magnetTimerRef.current));
      }

      // SINH VẬT PHẨM RƠI TỪ TRÊN TRẦN
      if (gameState === 'playing') {
        if (currentTime > nextSpawnTimeRef.current) {
          const spawnInterval = Math.max(360, 920 - wave * 60);
          nextSpawnTimeRef.current = currentTime + spawnInterval;

          // Tỉ lệ bổ trợ giảm dần theo Wave
          const heartProb = Math.max(0.04, 0.13 - wave * 0.015);
          const magnetProb = Math.max(0.03, 0.09 - wave * 0.012);
          const lightningProb = Math.min(0.3, 0.14 + wave * 0.022);

          const rand = Math.random();
          let type: ItemType = 'photo';
          let photoId: number | undefined;
          let tier: PointTier | undefined;

          if (rand < heartProb) {
            type = 'heart';
          } else if (rand < heartProb + magnetProb) {
            type = 'magnet';
          } else if (rand < heartProb + magnetProb + lightningProb) {
            type = 'lightning';
          } else {
            type = 'photo';
            tier = getRandomTier();
            const randomIdx = Math.floor(Math.random() * VALID_PHOTO_IDS.length);
            photoId = VALID_PHOTO_IDS[randomIdx];
          }

          const itemSize =
            type === 'photo' && tier
              ? tier.size
              : type === 'heart'
              ? 42
              : type === 'magnet'
              ? 42
              : 46;

          const baseSpeed = 160 + (wave - 1) * 26;
          const speed = (type === 'lightning' ? baseSpeed * 1.3 : baseSpeed) + Math.random() * 30;

          itemsRef.current.push({
            id: nextItemIdRef.current++,
            type,
            photoId,
            tier,
            x: Math.random() * (width - itemSize * 2 - 20) + itemSize + 10,
            y: -itemSize,
            size: itemSize,
            speed,
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 2.2,
            wobbleOffset: Math.random() * 10,
          });
        }
      }

      // CẬP NHẬT TỌA ĐỘ VẬT PHẨM & VA CHẠM
      if (gameState === 'playing') {
        const remainingItems: FallingItem[] = [];
        const isMagnetActive = magnetTimerRef.current > 0;

        itemsRef.current.forEach((item) => {
          // Nam châm hút ảnh & tim
          if (isMagnetActive && (item.type === 'photo' || item.type === 'heart')) {
            const dx = player.x - item.x;
            const dy = player.y - item.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 340) {
              const pullForce = (340 - dist) * 2.6;
              item.x += (dx / dist) * pullForce * dt;
              item.y += (dy / dist) * pullForce * dt;
            }
          }

          // Rơi xuống
          item.y += item.speed * dt;
          item.rotation += item.rotSpeed * dt;

          if (item.type === 'heart') {
            item.x += Math.sin((item.y + item.wobbleOffset * 15) * 0.04) * 1.6;
          }

          // VÙNG HỨNG CỦA SIÊU NHÂN (HITBOX RỘNG RÃI HƠN: 96px)
          const basketY = player.y - 20;
          const basketW = 96; // Mở rộng diện tích hứng sang 2 bên
          const basketH = 34;

          const isColliding =
            item.x + item.size / 2 >= player.x - basketW / 2 &&
            item.x - item.size / 2 <= player.x + basketW / 2 &&
            item.y + item.size / 2 >= basketY - basketH / 2 &&
            item.y - item.size / 2 <= basketY + basketH / 2;

          if (isColliding) {
            if (item.type === 'photo' && item.tier) {
              // HỨNG TRÚNG HÌNH EM BÉ: CỘNG THẲNG VÀO MÁU (HP = SCORE TĂNG LIÊN TỤC)
              const earned = item.tier.points;
              haptics.catchItem();
              setCombo((prev) => {
                const nextCombo = prev + 1;
                catcherSound.playCatch(nextCombo);
                return nextCombo;
              });

              setHp((prevHp) => {
                const nextHp = prevHp + earned;
                // Thăng cấp Wave mỗi 150 điểm/máu
                setWave(Math.floor(nextHp / 150) + 1);
                return nextHp;
              });

              addFloatingText(`+${earned} HP`, item.x, item.y - 14, '#10b981');
              addParticles(item.x, item.y, '#10b981', 14);
            } else if (item.type === 'heart') {
              // HỨNG TRÁI TIM VÀNG: HỒI 1 TIM & CỘNG 50 MÁU
              haptics.success();
              catcherSound.playHeart();
              setLives((l) => Math.min(3, l + 1));
              setHp((prevHp) => prevHp + 50);
              addFloatingText('+50 HP ❤️ HỒI TIM', item.x, item.y - 14, '#f59e0b');
              addParticles(item.x, item.y, '#f59e0b', 16);
            } else if (item.type === 'magnet') {
              // HỨNG NAM CHÂM: HÚT ẢNH 6 GIÂY + 25 MÁU
              haptics.success();
              catcherSound.playPowerup();
              magnetTimerRef.current = 6.0;
              setMagnetTimeLeft(6);
              setHp((prevHp) => prevHp + 25);
              addFloatingText('🧲 NAM CHÂM 6S', item.x, item.y - 14, '#0284c7');
              addParticles(item.x, item.y, '#38bdf8', 18);
            } else if (item.type === 'lightning') {
              // TRÚNG TIA SÉT ĐỎ: TRỪ 1 TIM & TRỪ 50 MÁU
              haptics.error();
              catcherSound.playHit();
              screenShakeRef.current = 0.32;
              setCombo(0);
              addFloatingText('-1 TIM & -50 HP ⚡', item.x, item.y - 14, '#ef4444');
              addParticles(item.x, item.y, '#dc2626', 24);

              setLives((prevLives) => {
                const nextLives = prevLives - 1;
                if (nextLives <= 0) {
                  setGameState('game_over');
                  haptics.gameOver();
                  catcherSound.playGameOver();
                  recordLeaderboard(hp, wave, elapsedSeconds);
                  return 0;
                }
                return nextLives;
              });

              setHp((prevHp) => {
                const nextHp = Math.max(0, prevHp - 50);
                if (nextHp <= 0) {
                  setGameState('game_over');
                  haptics.gameOver();
                  catcherSound.playGameOver();
                  recordLeaderboard(0, wave, elapsedSeconds);
                  return 0;
                }
                return nextHp;
              });
            }
            return;
          }

          // Xử lý khi rơi chạm đáy màn hình
          if (item.y < height + 40) {
            remainingItems.push(item);
          } else {
            // ĐỂ RƠI MẤT HÌNH EM BÉ: TRỪ MÁU THEO MỐC
            if (item.type === 'photo' && item.tier) {
              const penalty = item.tier.penalty;
              haptics.tap();
              setCombo(0);
              addFloatingText(`-${penalty} HP`, item.x, height - 25, '#ef4444');

              setHp((prevHp) => {
                const nextHp = Math.max(0, prevHp - penalty);
                if (nextHp <= 0) {
                  setGameState('game_over');
                  haptics.gameOver();
                  catcherSound.playGameOver();
                  recordLeaderboard(0, wave, elapsedSeconds);
                  return 0;
                }
                return nextHp;
              });
            }
          }
        });

        itemsRef.current = remainingItems;
      }

      // Rung màn hình khi trúng sét
      ctx.save();
      if (screenShakeRef.current > 0) {
        screenShakeRef.current = Math.max(0, screenShakeRef.current - dt);
        const shakeMag = screenShakeRef.current * 22;
        ctx.translate((Math.random() - 0.5) * shakeMag, (Math.random() - 0.5) * shakeMag);
      }

      // NỀN TRỜI TƯƠI SÁNG (GRADIENT TRỜI XANH DỊU MÁT + ĐỒI CỎ DƯỚI ĐÁY)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#bae6fd'); // Xanh da trời êm dịu
      skyGrad.addColorStop(0.7, '#e0f2fe'); // Trắng xanh mát
      skyGrad.addColorStop(1, '#fed7aa'); // Ánh hoàng hôn ấm áp
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Đồi cỏ xanh mát ở chân trời
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.ellipse(width * 0.25, height + 10, width * 0.45, 45, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(width * 0.8, height + 15, width * 0.55, 48, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sàn đất xanh
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, height - 16, width, 16);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, height - 4, width, 4);

      // VẼ CÁC VẬT PHẨM RƠI
      itemsRef.current.forEach((item) => {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);

        const r = item.size / 2;

        if (item.type === 'photo' && item.photoId && item.tier) {
          // 1. HÌNH EM BÉ: HÀO QUANG & VIỀN MÀU XANH LÁ
          ctx.beginPath();
          ctx.arc(0, 0, r + 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = '#064e3b';
          ctx.fill();
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = '#10b981'; // Viền xanh lá
          ctx.stroke();

          // Ảnh em bé
          const photoUrl = getTilePhotoUrl(item.photoId, customPhotos);
          const img = getPreloadedImage(photoUrl);

          if (img && img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, r - 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, -r, -r, item.size, item.size);
            ctx.restore();
          } else {
            ctx.fillStyle = '#10b981';
            ctx.font = `${Math.floor(r)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👧', 0, 0);
          }

          // Nhãn mốc điểm
          ctx.restore();
          ctx.save();
          ctx.translate(item.x, item.y);
          ctx.fillStyle = '#052e16';
          ctx.beginPath();
          ctx.roundRect(-r * 0.9, -r - 11, r * 1.8, 14, 6);
          ctx.fill();
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 9px "Press Start 2P", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.tier.label, 0, -r - 4);
          ctx.restore();
          return;
        } else if (item.type === 'heart') {
          // 2. TRÁI TIM VÀNG
          ctx.beginPath();
          ctx.arc(0, 0, r + 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
          ctx.fill();

          ctx.fillStyle = '#f59e0b';
          ctx.font = '26px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💛', 0, 1);
        } else if (item.type === 'magnet') {
          // 3. NAM CHÂM
          ctx.beginPath();
          ctx.arc(0, 0, r + 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
          ctx.fill();

          ctx.fillStyle = '#0284c7';
          ctx.font = '26px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🧲', 0, 0);
        } else if (item.type === 'lightning') {
          // 4. TIA SÉT ĐỎ NGUY HIỂM
          ctx.beginPath();
          ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = '#7f1d1d';
          ctx.fill();
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = '#ef4444'; // Đỏ rực
          ctx.stroke();

          ctx.fillStyle = '#fee2e2';
          ctx.font = '24px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡', 0, 0);
        }

        ctx.restore();
      });

      // VẼ MASCOT SIÊU NHÂN (THIẾT KẾ CHUẨN LOBBY, DANG RỘNG TAY HỨNG BÓNG DỄ DÀNG)
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.lean);

      // Hiệu ứng Nam châm
      if (magnetTimerRef.current > 0) {
        ctx.beginPath();
        ctx.arc(0, -10, 62, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.fill();
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 1. Áo choàng đỏ bay phía sau
      const capeWave = Math.sin(currentTime * 0.014) * 8;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-22, -4);
      ctx.lineTo(22, -4);
      ctx.lineTo(30 + capeWave, 42);
      ctx.lineTo(-30 + capeWave, 42);
      ctx.closePath();
      ctx.fill();

      // 2. Thân siêu nhân (Giáp xanh dương & thắt lưng vàng)
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(-22, -10, 44, 46, 12);
      ctx.fill();

      // Thắt lưng vàng
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-22, 14, 44, 6);

      // Ngôi sao trước ngực
      ctx.fillStyle = '#facc15';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 2);

      // 3. HAI TAY DANG RỘNG SANG 2 BÊN HỨNG BÓNG (TƯ THẾ SIÊU ANH HÙNG DANG TAY)
      // Cánh tay trái dang rộng
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.quadraticCurveTo(-36, -10, -44, -20);
      ctx.stroke();

      // Cánh tay phải dang rộng
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.quadraticCurveTo(36, -10, 44, -20);
      ctx.stroke();

      // Vùng năng lượng hứng bóng rộng 96px trải dài giữa 2 tay
      ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, -20, 48, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Hai bàn tay mở rộng ở 2 đầu vùng hứng
      ctx.fillStyle = '#fcd34d';
      ctx.beginPath();
      ctx.arc(-44, -20, 7, 0, Math.PI * 2);
      ctx.arc(44, -20, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 4. ĐẦU SIÊU NHÂN: KHUÔN MẶT ĐEO KÍNH CỦA BẠN ĐẶT TRÊN ĐỈNH
      const headRadius = 26;
      const headY = -38;

      if (heroHeadImgRef.current && heroHeadImgRef.current.complete) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(
          heroHeadImgRef.current,
          -headRadius,
          headY - headRadius,
          headRadius * 2,
          headRadius * 2
        );
        ctx.restore();

        // Viền vàng quanh đầu
        ctx.beginPath();
        ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#facc15';
        ctx.stroke();
      } else {
        ctx.fillStyle = '#fcd34d';
        ctx.beginPath();
        ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // VẼ HẠT NỔ PARTICLE
      const activeParticles: Particle[] = [];
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= dt * 1.8;
        if (p.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          activeParticles.push(p);
        }
      });
      particlesRef.current = activeParticles;

      // VẼ CHỮ NỔI FLOATING TEXT
      const activeTexts: FloatingText[] = [];
      floatingTextsRef.current.forEach((t) => {
        t.y -= dt * 42;
        t.alpha -= dt * 1.4;
        t.scale += dt * 0.3;
        if (t.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = t.alpha;
          ctx.fillStyle = t.color;
          ctx.font = 'bold 14px "Press Start 2P", sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = 4;
          ctx.fillText(t.text, t.x, t.y);
          ctx.restore();
          activeTexts.push(t);
        }
      });
      floatingTextsRef.current = activeTexts;

      ctx.restore();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, wave, customPhotos, getPreloadedImage, hp, elapsedSeconds, recordLeaderboard]);

  // Điều chỉnh kích thước canvas thích ứng màn hình & Đăng ký Touch Drag cho di động
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const handleResize = () => {
      const w = Math.min(640, parent.clientWidth || window.innerWidth);
      const h = parent.clientHeight || window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      playerRef.current.x = Math.max(50, Math.min(w - 50, playerRef.current.x));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const getCanvasX = (touch: Touch) => {
      const rect = canvas.getBoundingClientRect();
      const scale = canvas.width / rect.width;
      return (touch.clientX - rect.left) * scale;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        targetTouchXRef.current = getCanvasX(e.touches[0]);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        targetTouchXRef.current = getCanvasX(e.touches[0]);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        targetTouchXRef.current = null;
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-screen min-h-dvh h-dvh bg-slate-950 text-slate-100 flex flex-col lg:flex-row overflow-hidden select-none overscroll-none">
      {/* 0. THANH HUD CHO MOBILE / TABLET (< lg) */}
      <header className="lg:hidden w-full bg-slate-900/95 border-b border-slate-800 px-3 py-1.5 flex flex-col gap-1.5 z-20 shrink-0 backdrop-blur-md">
        {/* Hàng 1: Trạng thái Game - Sảnh, HP, Mạng, Wave, Thời gian */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                catcherSound.stopBgm();
                onBackToLobby();
              }}
              className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 active:scale-95 flex items-center gap-1 text-xs font-bold"
              title="Về Sảnh"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="text-[11px]">Sảnh</span>
            </button>
            <div className="flex items-center gap-1 font-arcade text-xs text-rose-400 font-bold bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
              <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
              <span>{hp} HP</span>
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={`text-xs ${i < lives ? 'opacity-100' : 'opacity-20'}`}>
                  ❤️
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <span className="px-2 py-0.5 rounded-lg bg-amber-400/15 border border-amber-400/30 text-[10px]">
              W{wave}
            </span>
            <span className="text-slate-400 font-medium text-[11px]">⏱️ {formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Hàng 2: Menu công cụ điều khiển tiện ích trên mobile (BGM, SFX, Pause, Kỷ lục, Fullscreen, Restart) */}
        <div className="w-full flex items-center justify-between pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
            {/* Nhạc nền BGM */}
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                const next = !bgmEnabled;
                setBgmEnabled(next);
                catcherSound.setBgmEnabled(next);
              }}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                bgmEnabled
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title={bgmEnabled ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
            >
              <Music className="w-3.5 h-3.5" />
            </button>

            {/* Tiếng hiệu ứng SFX */}
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                const next = !soundEnabled;
                setSoundEnabled(next);
                catcherSound.sfxEnabled = next;
              }}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title={soundEnabled ? 'Tắt tiếng hiệu ứng' : 'Bật tiếng hiệu ứng'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tạm dừng */}
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
              }}
              className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 active:scale-95"
              title={gameState === 'playing' ? 'Tạm dừng' : 'Tiếp tục'}
            >
              {gameState === 'playing' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            {/* Bảng xếp hạng */}
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                setIsLeaderboardOpen(true);
              }}
              className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 active:scale-95"
              title="Bảng xếp hạng"
            >
              <Trophy className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                toggleFullscreen();
              }}
              className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-sky-300 active:scale-95"
              title="Toàn màn hình"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>

            {/* Restart */}
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                handleRestart();
              }}
              className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 active:scale-95"
              title="Chơi lại trận mới"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 1. CỘT SIDEBAR BÊN TRÁI: HIỂN THỊ TRÊN MÀN HÌNH LỚN (>= lg) */}
      <aside className="hidden lg:flex w-72 sm:w-80 h-full shrink-0 bg-slate-900/95 border-r border-slate-800 p-4 flex-col justify-between z-20 backdrop-blur-md overflow-y-auto">
        {/* Nhóm 1: Tiêu đề & Mascot */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                catcherSound.stopBgm();
                onBackToLobby();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Quay về sảnh chọn game"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sảnh</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 cursor-pointer"
              title="Toàn màn hình"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <SuperheroAvatar size={48} animate={false} />
            <div>
              <h1 className="text-sm font-black font-arcade text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-sky-400 to-rose-400">
                Phuong Catcher
              </h1>
              <p className="text-[11px] text-slate-400 font-bold">Siêu Nhân Hứng Em Bé</p>
            </div>
          </div>

          {/* Nhóm 2: MÁU HIỆN TẠI & SỐ TIM */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Máu Hiện Tại</span>
              </span>
              <span className="font-arcade text-xs text-rose-400 font-bold">
                {hp} HP
              </span>
            </div>

            {/* Thanh tiến trình Máu */}
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-300 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                style={{ width: `${Math.min(100, Math.max(8, (hp / 500) * 100))}%` }}
              />
            </div>

            {/* Tim sống sót */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-slate-400">Số mạng (Tim):</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 transition-all ${
                      i < lives
                        ? 'text-rose-500 fill-rose-500 scale-110 drop-shadow-[0_0_6px_rgba(244,63,94,0.7)]'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Nhóm 3: Wave & Thời gian */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Cấp Độ</div>
              <div className="font-black font-arcade text-amber-400 text-sm mt-0.5">
                Wave {wave}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Thời Gian</div>
              <div className="font-black font-arcade text-sky-400 text-sm mt-0.5">
                {formatTime(elapsedSeconds)}
              </div>
            </div>
          </div>

          {/* Nhóm 4: Combo & Nam châm */}
          <div className="space-y-2">
            {combo > 1 && (
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between animate-pulse">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  <span>Combo Hứng Liên Tiếp</span>
                </span>
                <span className="font-arcade text-xs text-rose-400 font-black">
                  x{combo}
                </span>
              </div>
            )}

            {magnetTimeLeft > 0 && (
              <div className="p-2.5 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1">
                  <Magnet className="w-3.5 h-3.5 text-sky-400" />
                  <span>Hút Nam Châm</span>
                </span>
                <span className="font-arcade text-xs text-sky-300 font-black">
                  {magnetTimeLeft}s
                </span>
              </div>
            )}
          </div>

          {/* Nhóm 5: Bảng mốc điểm */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-[11px]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Mốc Điểm / Phạt
            </div>
            <div className="flex justify-between text-slate-300 font-semibold">
              <span className="text-emerald-400">+10 (-3)</span>
              <span className="text-emerald-400">+20 (-6)</span>
              <span className="text-emerald-400">+50 (-15)</span>
            </div>
            <div className="flex justify-between text-slate-300 font-semibold">
              <span className="text-amber-300">+100 (-30)</span>
              <span className="text-amber-300">+200 (-80)</span>
              <span className="text-rose-400 font-bold">+500 (-250)</span>
            </div>
          </div>
        </div>

        {/* Nhóm Footer Sidebar: Các nút điều khiển */}
        <div className="space-y-2.5 pt-4 border-t border-slate-800">
          {/* Nút Bảng xếp hạng */}
          <button
            type="button"
            onClick={() => setIsLeaderboardOpen(true)}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>BẢNG XẾP HẠNG</span>
          </button>

          {/* Hàng nút Tiện ích âm thanh & Tạm dừng */}
          <div className="flex items-center justify-between gap-1.5">
            {/* Tạm dừng */}
            <button
              type="button"
              onClick={() => setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'))}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              {gameState === 'playing' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{gameState === 'playing' ? 'Dừng' : 'Chơi'}</span>
            </button>

            {/* BGM Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !bgmEnabled;
                setBgmEnabled(next);
                catcherSound.setBgmEnabled(next);
              }}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                bgmEnabled ? 'bg-sky-500/20 border-sky-500/50 text-sky-300' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title={bgmEnabled ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
            >
              <Music className="w-4 h-4" />
            </button>

            {/* SFX Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                catcherSound.sfxEnabled = next;
              }}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title={soundEnabled ? 'Tắt tiếng hiệu ứng' : 'Bật tiếng hiệu ứng'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Restart */}
            <button
              type="button"
              onClick={handleRestart}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 cursor-pointer"
              title="Chơi lại trận mới"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[10px] text-slate-400 text-center font-bold">
            Điều khiển: Dùng ⬅️ ➡️ hoặc trượt ngón tay
          </div>
        </div>
      </aside>

      {/* 2. KHU VỰC CHƠI GAME CANVAS: MỞ RỘNG TỐI ĐA TRÊN MÀN HÌNH */}
      <main className="flex-1 h-full flex items-center justify-center p-0 overflow-hidden relative bg-slate-950">
        <div className="relative w-[640px] max-w-full h-full overflow-hidden shadow-2xl border-x-0 lg:border-x-2 border-slate-800 bg-slate-900 flex flex-col">
          <canvas
            ref={canvasRef}
            className="w-full h-full block touch-none"
            style={{ touchAction: 'none' }}
          />

          {/* Hướng dẫn thao tác lúc đầu trận */}
          {elapsedSeconds < 4 && gameState === 'playing' && (
            <div className="absolute bottom-16 sm:bottom-6 inset-x-0 flex justify-center pointer-events-none animate-bounce px-3">
              <div className="px-3.5 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-xs font-bold text-slate-200 shadow-xl flex items-center gap-2 text-center">
                <span>👉 Dùng ⬅️ ➡️ hoặc trượt tay trên màn hình để di chuyển!</span>
              </div>
            </div>
          )}

          {/* CẶP NÚT ẢO ĐIỀU KHIỂN BẰNG 2 NGÓN TAY CÁI CHO ĐIỆN THOẠI (< lg) - LIQUID GLASS */}
          <div className="lg:hidden absolute bottom-5 inset-x-5 flex justify-between pointer-events-none z-20">
            {/* Nút di chuyển Trái */}
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
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl liquid-glass-btn flex items-center justify-center pointer-events-auto transition-all duration-150 active:scale-85 active:bg-rose-500/40 active:border-rose-300/80 active:shadow-[0_0_25px_rgba(244,63,94,0.7)] select-none cursor-pointer"
            >
              <ArrowLeft className="w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] stroke-[2.8]" />
            </button>

            {/* Nút di chuyển Phải */}
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
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl liquid-glass-btn flex items-center justify-center pointer-events-auto transition-all duration-150 active:scale-85 active:bg-rose-500/40 active:border-rose-300/80 active:shadow-[0_0_25px_rgba(244,63,94,0.7)] select-none cursor-pointer"
            >
              <ArrowRight className="w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] stroke-[2.8]" />
            </button>
          </div>

          {/* MODAL TẠM DỪNG */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-30">
              <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 text-center space-y-4 max-w-xs w-full shadow-2xl">
                <h2 className="text-xl font-black font-arcade text-amber-300">TẠM DỪNG</h2>
                <p className="text-xs text-slate-300">Nghỉ tay một chút rồi tiếp tục hứng em bé nhé!</p>
                <button
                  type="button"
                  onClick={() => setGameState('playing')}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Play className="w-4 h-4" />
                  <span>TIẾP TỤC CHƠI</span>
                </button>
              </div>
            </div>
          )}

          {/* MODAL KẾT THÚC TRẬN (GAME OVER) */}
          {gameState === 'game_over' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 z-40 animate-fadeIn">
              <div className="w-full max-w-sm bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 shadow-2xl text-center space-y-4">
                <div className="flex justify-center">
                  <SuperheroAvatar size={76} />
                </div>

                <div>
                  <h2 className="text-xl font-black font-arcade text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-300">
                    HẾT MÁU / HẾT MẠNG!
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    {hp >= 500
                      ? 'Siêu Anh Hùng Tình Yêu Xuất Sắc! 🦸‍♂️'
                      : hp >= 150
                      ? 'Phản xạ rất tuyệt vời! Cố lên nhé! ✨'
                      : 'Né sét đỏ và hứng thật nhiều em bé nào! ❤️'}
                  </p>
                </div>

                {/* Bảng điểm chi tiết */}
                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Máu kết thúc:</span>
                    <span className="text-amber-300 font-arcade text-base">{hp.toLocaleString()} HP</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kỷ lục cao nhất:</span>
                    <span className="text-emerald-400 font-arcade text-sm">{bestHp.toLocaleString()} HP</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Đợt đạt tới:</span>
                    <span className="text-sky-400 font-bold">Wave {wave}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Thời gian sống sót:</span>
                    <span className="text-slate-200 font-semibold">{formatTime(elapsedSeconds)}</span>
                  </div>
                </div>

                {isNewBest && (
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 animate-pulse">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>KỶ LỤC MÁU MỚI ĐƯỢC THIẾT LẬP!</span>
                  </div>
                )}

                {/* Nút hành động */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>CHƠI LẠI TRẬN MỚI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      catcherSound.stopBgm();
                      onBackToLobby();
                    }}
                    className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Quay về sảnh chọn game
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL BẢNG XẾP HẠNG KỶ LỤC CHO CATCHER */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        entries={leaderboard}
        onClose={() => setIsLeaderboardOpen(false)}
        onClear={() => {
          clearLeaderboard(CATCHER_LEADERBOARD_KEY);
          setLeaderboard([]);
        }}
        title="Bảng xếp hạng Phuong Catcher"
        subtitle="Lịch sử cứu em bé xuất sắc của Siêu Nhân"
        scoreColumnLabel="Máu / Điểm"
        stageColumnLabel="Đợt (Wave)"
        stageBadgePrefix="Wave"
      />
    </div>
  );
};
