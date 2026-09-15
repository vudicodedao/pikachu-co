// 36 biểu tượng mặc định cực kỳ bắt mắt, dễ phân biệt
// Hoạt động ngay tức thì trước khi người dùng nạp ảnh bạn gái

export interface AvatarMeta {
  emoji: string;
  bgStart: string;
  bgEnd: string;
  title: string;
}

export const DEFAULT_AVATARS: AvatarMeta[] = [
  { emoji: '💖', bgStart: '#f43f5e', bgEnd: '#be123c', title: 'Trái tim' },
  { emoji: '🌸', bgStart: '#ec4899', bgEnd: '#be185d', title: 'Hoa anh đào' },
  { emoji: '🐱', bgStart: '#f59e0b', bgEnd: '#d97706', title: 'Mèo con' },
  { emoji: '🐶', bgStart: '#d97706', bgEnd: '#b45309', title: 'Cún cưng' },
  { emoji: '🍓', bgStart: '#ef4444', bgEnd: '#b91c1c', title: 'Dâu tây' },
  { emoji: '🎀', bgStart: '#f472b6', bgEnd: '#db2777', title: 'Nơ hồng' },
  { emoji: '🧸', bgStart: '#854d0e', bgEnd: '#713f12', title: 'Gấu bông' },
  { emoji: '🍰', bgStart: '#fb7185', bgEnd: '#e11d48', title: 'Bánh kem' },
  { emoji: '💍', bgStart: '#38bdf8', bgEnd: '#0284c7', title: 'Nhẫn đôi' },
  { emoji: '👑', bgStart: '#eab308', bgEnd: '#ca8a04', title: 'Vương miện' },
  { emoji: '🦄', bgStart: '#a855f7', bgEnd: '#7e22ce', title: 'Kỳ lân' },
  { emoji: '🌈', bgStart: '#06b6d4', bgEnd: '#0891b2', title: 'Cầu vồng' },
  { emoji: '☕', bgStart: '#78350f', bgEnd: '#451a03', title: 'Cà phê' },
  { emoji: '🎮', bgStart: '#6366f1', bgEnd: '#4338ca', title: 'Máy game' },
  { emoji: '🌙', bgStart: '#475569', bgEnd: '#1e293b', title: 'Trăng khuyết' },
  { emoji: '☀️', bgStart: '#f97316', bgEnd: '#ea580c', title: 'Mặt trời' },
  { emoji: '🍦', bgStart: '#fde047', bgEnd: '#eab308', title: 'Kem ốc quế' },
  { emoji: '🥑', bgStart: '#84cc16', bgEnd: '#65a30d', title: 'Quả bơ' },
  { emoji: '🐼', bgStart: '#334155', bgEnd: '#0f172a', title: 'Gấu trúc' },
  { emoji: '🦊', bgStart: '#ea580c', bgEnd: '#c2410c', title: 'Cáo nhỏ' },
  { emoji: '🌻', bgStart: '#facc15', bgEnd: '#ca8a04', title: 'Hướng dương' },
  { emoji: '🍩', bgStart: '#d946ef', bgEnd: '#a21caf', title: 'Donut' },
  { emoji: '🍫', bgStart: '#581c87', bgEnd: '#3b0764', title: 'Chocolate' },
  { emoji: '💎', bgStart: '#0ea5e9', bgEnd: '#0369a1', title: 'Kim cương' },
  { emoji: '💌', bgStart: '#fb7185', bgEnd: '#f43f5e', title: 'Thư tình' },
  { emoji: '🎈', bgStart: '#dc2626', bgEnd: '#991b1b', title: 'Bóng bay' },
  { emoji: '🎁', bgStart: '#10b981', bgEnd: '#047857', title: 'Hộp quà' },
  { emoji: '🚀', bgStart: '#2563eb', bgEnd: '#1d4ed8', title: 'Tên lửa' },
  { emoji: '🎵', bgStart: '#8b5cf6', bgEnd: '#6d28d9', title: 'Nốt nhạc' },
  { emoji: '🍀', bgStart: '#16a34a', bgEnd: '#15803d', title: 'Cỏ 4 lá' },
  { emoji: '🧁', bgStart: '#f472b6', bgEnd: '#be185d', title: 'Cupcake' },
  { emoji: '🍒', bgStart: '#e11d48', bgEnd: '#9f1239', title: 'Cherry' },
  { emoji: '🔮', bgStart: '#7c3aed', bgEnd: '#5b21b6', title: 'Pha lê' },
  { emoji: '🎨', bgStart: '#14b8a6', bgEnd: '#0f766e', title: 'Bảng màu' },
  { emoji: '🐰', bgStart: '#fb923c', bgEnd: '#ea580c', title: 'Thỏ trắng' },
  { emoji: '🐾', bgStart: '#64748b', bgEnd: '#334155', title: 'Vết chân' },
];

// Tạo SVG data URI cho mỗi avatar
export function getDefaultAvatarUrl(typeId: number): string {
  const meta = DEFAULT_AVATARS[(typeId - 1) % DEFAULT_AVATARS.length];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${meta.bgStart}" />
          <stop offset="100%" stop-color="${meta.bgEnd}" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="14" fill="url(#grad)" />
      <circle cx="50" cy="50" r="38" fill="rgba(255,255,255,0.18)" />
      <text x="50" y="60" font-size="44" text-anchor="middle" dominant-baseline="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif">${meta.emoji}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
