export interface Position {
  r: number; // Row index: 0..BOARD_ROWS+1 (includes padding)
  c: number; // Col index: 0..BOARD_COLS+1 (includes padding)
}

export type GravityType =
  | 'static'  // Màn 1: Cố định
  | 'down'    // Màn 2: Rơi xuống
  | 'up'      // Màn 3: Dồn lên trên
  | 'left'    // Màn 4: Dồn sang trái
  | 'right'   // Màn 5: Dồn sang phải
  | 'center'  // Màn 6: Hút vào tâm ngang
  | 'split'   // Màn 7: Bung ra hai biên
  | 'shuffle'; // Màn 8: Đảo vị trí ngẫu nhiên

export interface StageConfig {
  stage: number;
  name: string;
  description: string;
  gravity: GravityType;
  timeSeconds: number;
}

export type GameStatus = 'ready' | 'playing' | 'paused' | 'stage_clear' | 'game_over' | 'victory';

export interface ConnectPath {
  points: Position[]; // Array of points connecting the two tiles
  timestamp: number;
}
