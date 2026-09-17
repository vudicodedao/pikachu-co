// Haptics utility cho trải nghiệm rung phản hồi trên thiết bị di động
export const haptics = {
  // Rung nhẹ khi chạm nút bấm (12ms)
  tap: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12);
      }
    } catch {
      // ignore
    }
  },

  // Rung khi ăn điểm / thành công (nhịp đôi vui tươi)
  success: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([20, 40, 25]);
      }
    } catch {
      // ignore
    }
  },

  // Rung khi hứng được bóng / lật trúng bài
  catchItem: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(22);
      }
    } catch {
      // ignore
    }
  },

  // Rung cảnh báo khi chạm sét / sai mật mã / mất máu
  error: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([45, 60, 45]);
      }
    } catch {
      // ignore
    }
  },

  // Rung mạnh khi Game Over
  gameOver: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([70, 80, 100]);
      }
    } catch {
      // ignore
    }
  },
};
