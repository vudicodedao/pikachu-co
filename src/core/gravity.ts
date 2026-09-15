import { GravityType, StageConfig } from '../types/game';
import { BOARD_ROWS, BOARD_COLS, TOTAL_ROWS, TOTAL_COLS, shuffleBoardInPlace } from './algorithm';

export const STAGE_CONFIGS: StageConfig[] = [
  {
    stage: 1,
    name: 'Màn 1: Yên Bình',
    description: 'Bàn cờ cố định, không có trọng lực.',
    gravity: 'static',
    timeSeconds: 600, // 10 phút mặc định
  },
  {
    stage: 2,
    name: 'Màn 2: Rơi Tự Do',
    description: 'Các ô phía trên rơi xuống đáy cột.',
    gravity: 'down',
    timeSeconds: 600,
  },
  {
    stage: 3,
    name: 'Màn 3: Bay Lên Trời',
    description: 'Các ô phía dưới bị hút lên đỉnh cột.',
    gravity: 'up',
    timeSeconds: 600,
  },
  {
    stage: 4,
    name: 'Màn 4: Trôi Về Trái',
    description: 'Các ô trong hàng dồn hết về bên trái.',
    gravity: 'left',
    timeSeconds: 600,
  },
  {
    stage: 5,
    name: 'Màn 5: Tấp Về Phải',
    description: 'Các ô trong hàng dồn hết về bên phải.',
    gravity: 'right',
    timeSeconds: 600,
  },
  {
    stage: 6,
    name: 'Màn 6: Hút Vào Tâm',
    description: 'Hai bên dồn vào trục giữa bàn cờ.',
    gravity: 'center',
    timeSeconds: 600,
  },
  {
    stage: 7,
    name: 'Màn 7: Bung Sang Biên',
    description: 'Các ô từ giữa bị đẩy dạt ra hai mép ngoài.',
    gravity: 'split',
    timeSeconds: 600,
  },
  {
    stage: 8,
    name: 'Màn 8: Hỗn Loạn',
    description: 'Mỗi lần ăn thành công, toàn bộ vị trí bị xáo trộn!',
    gravity: 'shuffle',
    timeSeconds: 600,
  },
  {
    stage: 9,
    name: 'Màn 9: Ảo Giác Xoay 4 Hướng',
    description: 'Ảnh bị xoay 90°, 180°, 270° ngẫu nhiên thách thức thị giác!',
    gravity: 'rotate',
    timeSeconds: 600,
  },
];

// Sinh ma trận góc xoay 4 hướng (0, 90, 180, 270 độ) cho Màn 9
export function generateRotations(): number[][] {
  const angles = [0, 90, 180, 270];
  return Array.from({ length: TOTAL_ROWS }, () =>
    Array.from({ length: TOTAL_COLS }, () => angles[Math.floor(Math.random() * angles.length)])
  );
}

// Áp dụng cơ chế dồn ô theo loại trọng lực
export function applyGravity(board: number[][], gravity: GravityType): number[][] {
  const newBoard = board.map((row) => [...row]);

  switch (gravity) {
    case 'static':
    case 'rotate':
      return newBoard;

    case 'down': {
      // Dồn xuống: các ô không rỗng dồn về phía đáy (hàng 9)
      for (let c = 1; c <= BOARD_COLS; c++) {
        const nonZeros: number[] = [];
        for (let r = 1; r <= BOARD_ROWS; r++) {
          if (newBoard[r][c] !== 0) {
            nonZeros.push(newBoard[r][c]);
          }
        }
        const zerosCount = BOARD_ROWS - nonZeros.length;
        for (let r = 1; r <= zerosCount; r++) {
          newBoard[r][c] = 0;
        }
        for (let i = 0; i < nonZeros.length; i++) {
          newBoard[zerosCount + 1 + i][c] = nonZeros[i];
        }
      }
      return newBoard;
    }

    case 'up': {
      // Dồn lên: các ô không rỗng dồn về đỉnh (hàng 1)
      for (let c = 1; c <= BOARD_COLS; c++) {
        const nonZeros: number[] = [];
        for (let r = 1; r <= BOARD_ROWS; r++) {
          if (newBoard[r][c] !== 0) {
            nonZeros.push(newBoard[r][c]);
          }
        }
        for (let i = 0; i < nonZeros.length; i++) {
          newBoard[1 + i][c] = nonZeros[i];
        }
        for (let r = 1 + nonZeros.length; r <= BOARD_ROWS; r++) {
          newBoard[r][c] = 0;
        }
      }
      return newBoard;
    }

    case 'left': {
      // Dồn sang trái: các ô không rỗng dồn về cột 1
      for (let r = 1; r <= BOARD_ROWS; r++) {
        const nonZeros: number[] = [];
        for (let c = 1; c <= BOARD_COLS; c++) {
          if (newBoard[r][c] !== 0) {
            nonZeros.push(newBoard[r][c]);
          }
        }
        for (let i = 0; i < nonZeros.length; i++) {
          newBoard[r][1 + i] = nonZeros[i];
        }
        for (let c = 1 + nonZeros.length; c <= BOARD_COLS; c++) {
          newBoard[r][c] = 0;
        }
      }
      return newBoard;
    }

    case 'right': {
      // Dồn sang phải: các ô không rỗng dồn về cột 16
      for (let r = 1; r <= BOARD_ROWS; r++) {
        const nonZeros: number[] = [];
        for (let c = 1; c <= BOARD_COLS; c++) {
          if (newBoard[r][c] !== 0) {
            nonZeros.push(newBoard[r][c]);
          }
        }
        const zerosCount = BOARD_COLS - nonZeros.length;
        for (let c = 1; c <= zerosCount; c++) {
          newBoard[r][c] = 0;
        }
        for (let i = 0; i < nonZeros.length; i++) {
          newBoard[r][zerosCount + 1 + i] = nonZeros[i];
        }
      }
      return newBoard;
    }

    case 'center': {
      // Hút vào tâm: nửa trái (cột 1..8) dồn về cột 8; nửa phải (cột 9..16) dồn về cột 9
      const mid = Math.floor(BOARD_COLS / 2); // 8
      for (let r = 1; r <= BOARD_ROWS; r++) {
        // Nửa trái
        const leftNonZeros: number[] = [];
        for (let c = 1; c <= mid; c++) {
          if (newBoard[r][c] !== 0) leftNonZeros.push(newBoard[r][c]);
        }
        const leftZeros = mid - leftNonZeros.length;
        for (let c = 1; c <= leftZeros; c++) newBoard[r][c] = 0;
        for (let i = 0; i < leftNonZeros.length; i++) {
          newBoard[r][leftZeros + 1 + i] = leftNonZeros[i];
        }

        // Nửa phải
        const rightNonZeros: number[] = [];
        for (let c = mid + 1; c <= BOARD_COLS; c++) {
          if (newBoard[r][c] !== 0) rightNonZeros.push(newBoard[r][c]);
        }
        for (let i = 0; i < rightNonZeros.length; i++) {
          newBoard[r][mid + 1 + i] = rightNonZeros[i];
        }
        for (let c = mid + 1 + rightNonZeros.length; c <= BOARD_COLS; c++) {
          newBoard[r][c] = 0;
        }
      }
      return newBoard;
    }

    case 'split': {
      // Bung ra hai biên: nửa trái dồn về cột 1; nửa phải dồn về cột 16
      const mid = Math.floor(BOARD_COLS / 2); // 8
      for (let r = 1; r <= BOARD_ROWS; r++) {
        // Nửa trái: dồn về cột 1
        const leftNonZeros: number[] = [];
        for (let c = 1; c <= mid; c++) {
          if (newBoard[r][c] !== 0) leftNonZeros.push(newBoard[r][c]);
        }
        for (let i = 0; i < leftNonZeros.length; i++) {
          newBoard[r][1 + i] = leftNonZeros[i];
        }
        for (let c = 1 + leftNonZeros.length; c <= mid; c++) {
          newBoard[r][c] = 0;
        }

        // Nửa phải: dồn về cột 16
        const rightNonZeros: number[] = [];
        for (let c = mid + 1; c <= BOARD_COLS; c++) {
          if (newBoard[r][c] !== 0) rightNonZeros.push(newBoard[r][c]);
        }
        const rightZeros = (BOARD_COLS - mid) - rightNonZeros.length;
        for (let c = mid + 1; c <= mid + rightZeros; c++) {
          newBoard[r][c] = 0;
        }
        for (let i = 0; i < rightNonZeros.length; i++) {
          newBoard[r][mid + rightZeros + 1 + i] = rightNonZeros[i];
        }
      }
      return newBoard;
    }

    case 'shuffle': {
      // Đảo vị trí ngẫu nhiên
      shuffleBoardInPlace(newBoard);
      return newBoard;
    }

    default:
      return newBoard;
  }
}
