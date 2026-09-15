import { Position } from '../types/game';

export const BOARD_ROWS = 9;
export const BOARD_COLS = 16;
// Kích thước có thêm viền ngoài (padding):
export const TOTAL_ROWS = BOARD_ROWS + 2; // 11
export const TOTAL_COLS = BOARD_COLS + 2; // 18
export const NUM_DISTINCT_TILES = 36; // 36 loại ảnh khác nhau

// Kiểm tra đường thẳng giữa 2 điểm cùng hàng hoặc cùng cột (loại trừ 2 điểm đầu cuối)
export function checkStraightLine(
  board: number[][],
  p1: Position,
  p2: Position
): boolean {
  if (p1.r === p2.r) {
    const minC = Math.min(p1.c, p2.c);
    const maxC = Math.max(p1.c, p2.c);
    for (let c = minC + 1; c < maxC; c++) {
      if (board[p1.r][c] !== 0) return false;
    }
    return true;
  }
  if (p1.c === p2.c) {
    const minR = Math.min(p1.r, p2.r);
    const maxR = Math.max(p1.r, p2.r);
    for (let r = minR + 1; r < maxR; r++) {
      if (board[r][p1.c] !== 0) return false;
    }
    return true;
  }
  return false;
}

// Kiểm tra nối thẳng (0 khúc gấp - đường I)
export function checkLineI(
  board: number[][],
  p1: Position,
  p2: Position
): Position[] | null {
  if (p1.r === p2.r || p1.c === p2.c) {
    if (checkStraightLine(board, p1, p2)) {
      return [p1, p2];
    }
  }
  return null;
}

// Kiểm tra nối 1 góc vuông (1 khúc gấp - đường L)
export function checkLineL(
  board: number[][],
  p1: Position,
  p2: Position
): Position[] | null {
  // Góc 1: (p1.r, p2.c)
  const c1: Position = { r: p1.r, c: p2.c };
  if (board[c1.r][c1.c] === 0) {
    if (checkStraightLine(board, p1, c1) && checkStraightLine(board, c1, p2)) {
      return [p1, c1, p2];
    }
  }

  // Góc 2: (p2.r, p1.c)
  const c2: Position = { r: p2.r, c: p1.c };
  if (board[c2.r][c2.c] === 0) {
    if (checkStraightLine(board, p1, c2) && checkStraightLine(board, c2, p2)) {
      return [p1, c2, p2];
    }
  }

  return null;
}

// Kiểm tra nối 2 góc vuông (2 khúc gấp - đường Z / U)
export function checkLineZ(
  board: number[][],
  p1: Position,
  p2: Position
): Position[] | null {
  // Quét theo chiều ngang (các cột từ 0 đến TOTAL_COLS - 1)
  for (let c = 0; c < TOTAL_COLS; c++) {
    // Không xét cột nếu (p1.r, c) không trống (trừ khi chính là p1)
    if (c !== p1.c && board[p1.r][c] !== 0) continue;
    if (c !== p2.c && board[p2.r][c] !== 0) continue;

    const corner1: Position = { r: p1.r, c };
    const corner2: Position = { r: p2.r, c };

    // Kiểm tra đoạn p1 -> corner1
    const p1ToC1 = (c === p1.c) || checkStraightLine(board, p1, corner1);
    // Kiểm tra đoạn corner1 -> corner2
    const c1ToC2 = checkStraightLine(board, corner1, corner2);
    // Kiểm tra đoạn corner2 -> p2
    const c2ToP2 = (c === p2.c) || checkStraightLine(board, corner2, p2);

    if (p1ToC1 && c1ToC2 && c2ToP2) {
      return [p1, corner1, corner2, p2];
    }
  }

  // Quét theo chiều dọc (các hàng từ 0 đến TOTAL_ROWS - 1)
  for (let r = 0; r < TOTAL_ROWS; r++) {
    if (r !== p1.r && board[r][p1.c] !== 0) continue;
    if (r !== p2.r && board[r][p2.c] !== 0) continue;

    const corner1: Position = { r, c: p1.c };
    const corner2: Position = { r, c: p2.c };

    const p1ToC1 = (r === p1.r) || checkStraightLine(board, p1, corner1);
    const c1ToC2 = checkStraightLine(board, corner1, corner2);
    const c2ToP2 = (r === p2.r) || checkStraightLine(board, corner2, p2);

    if (p1ToC1 && c1ToC2 && c2ToP2) {
      return [p1, corner1, corner2, p2];
    }
  }

  return null;
}

// Hàm tổng hợp: kiểm tra đường đi tối đa 2 góc cua
export function findPath(
  board: number[][],
  p1: Position,
  p2: Position
): Position[] | null {
  // Hai ô phải khác nhau và có cùng loại ô > 0
  if (p1.r === p2.r && p1.c === p2.c) return null;
  if (board[p1.r][p1.c] === 0 || board[p2.r][p2.c] === 0) return null;
  if (board[p1.r][p1.c] !== board[p2.r][p2.c]) return null;

  // 1. Kiểm tra đường thẳng (0 cua)
  const pathI = checkLineI(board, p1, p2);
  if (pathI) return pathI;

  // 2. Kiểm tra đường 1 góc (1 cua)
  const pathL = checkLineL(board, p1, p2);
  if (pathL) return pathL;

  // 3. Kiểm tra đường 2 góc (2 cua)
  const pathZ = checkLineZ(board, p1, p2);
  if (pathZ) return pathZ;

  return null;
}

// Tìm bất kỳ cặp nào có thể nối được trên bàn cờ (dùng cho gợi ý và kiểm tra bế tắc)
export function findValidPair(
  board: number[][]
): { p1: Position; p2: Position; path: Position[] } | null {
  const activePositions: Position[] = [];

  for (let r = 1; r <= BOARD_ROWS; r++) {
    for (let c = 1; c <= BOARD_COLS; c++) {
      if (board[r][c] > 0) {
        activePositions.push({ r, c });
      }
    }
  }

  for (let i = 0; i < activePositions.length; i++) {
    for (let j = i + 1; j < activePositions.length; j++) {
      const p1 = activePositions[i];
      const p2 = activePositions[j];
      if (board[p1.r][p1.c] === board[p2.r][p2.c]) {
        const path = findPath(board, p1, p2);
        if (path) {
          return { p1, p2, path };
        }
      }
    }
  }

  return null;
}

// Khởi tạo bàn cờ mới: 9 x 16 = 144 ô, 36 loại ảnh x 4 ô
export function generateBoard(): number[][] {
  // Tạo mảng trống có viền đệm: TOTAL_ROWS x TOTAL_COLS
  const board: number[][] = Array.from({ length: TOTAL_ROWS }, () =>
    Array(TOTAL_COLS).fill(0)
  );

  // Sinh 144 giá trị
  const tiles: number[] = [];
  for (let type = 1; type <= NUM_DISTINCT_TILES; type++) {
    tiles.push(type, type, type, type); // mỗi loại 4 ô = 144
  }

  // Thuật toán xáo mảng Fisher-Yates
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  // Điền vào bàn cờ từ (1, 1) đến (9, 16)
  let idx = 0;
  for (let r = 1; r <= BOARD_ROWS; r++) {
    for (let c = 1; c <= BOARD_COLS; c++) {
      board[r][c] = tiles[idx++];
    }
  }

  // Đảm bảo bàn cờ sinh ra có ít nhất 1 nước đi hợp lệ
  let validPair = findValidPair(board);
  let attempts = 0;
  while (!validPair && attempts < 100) {
    shuffleBoardInPlace(board);
    validPair = findValidPair(board);
    attempts++;
  }

  return board;
}

// Xáo bài giữ nguyên vị trí các ô còn sống trên bàn cờ
export function shuffleBoardInPlace(board: number[][]): boolean {
  const occupiedCells: Position[] = [];
  const values: number[] = [];

  for (let r = 1; r <= BOARD_ROWS; r++) {
    for (let c = 1; c <= BOARD_COLS; c++) {
      if (board[r][c] > 0) {
        occupiedCells.push({ r, c });
        values.push(board[r][c]);
      }
    }
  }

  if (values.length === 0) return true;

  // Thử đảo nhiều lần cho đến khi có ít nhất 1 nước đi
  for (let attempt = 0; attempt < 50; attempt++) {
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }

    for (let i = 0; i < occupiedCells.length; i++) {
      const { r, c } = occupiedCells[i];
      board[r][c] = values[i];
    }

    if (findValidPair(board)) {
      return true;
    }
  }

  return false;
}

// Đếm số ô còn lại trên bàn cờ
export function countRemainingTiles(board: number[][]): number {
  let count = 0;
  for (let r = 1; r <= BOARD_ROWS; r++) {
    for (let c = 1; c <= BOARD_COLS; c++) {
      if (board[r][c] > 0) count++;
    }
  }
  return count;
}
