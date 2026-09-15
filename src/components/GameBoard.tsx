import React, { useRef } from 'react';
import { Position } from '../types/game';
import { TOTAL_ROWS, TOTAL_COLS } from '../core/algorithm';
import { ConnectLineCanvas } from './ConnectLineCanvas';
import { getTilePhotoUrl, getDefaultAvatarUrl } from '../utils/photoStorage';

interface GameBoardProps {
  board: number[][];
  selectedTile: Position | null;
  hintPair: { p1: Position; p2: Position } | null;
  lastPath: Position[] | null;
  customPhotos: Record<number, string>;
  rotations?: number[][] | null;
  onTileClick: (pos: Position) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  selectedTile,
  hintPair,
  lastPath,
  customPhotos,
  rotations,
  onTileClick,
}) => {
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="relative mx-auto flex items-center justify-center p-3 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
      {/* Lớp Canvas vẽ đường laser nối các ô */}
      <ConnectLineCanvas
        path={lastPath}
        gridRef={gridContainerRef}
        totalRows={TOTAL_ROWS}
        totalCols={TOTAL_COLS}
      />

      {/* Lưới 11 hàng x 18 cột (bao gồm 1 lớp viền rỗng để vẽ đường đi vòng ra ngoài) */}
      <div
        ref={gridContainerRef}
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${TOTAL_COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${TOTAL_ROWS}, minmax(0, 1fr))`,
          width: '100%',
          maxWidth: '1180px',
          aspectRatio: '18 / 11',
        }}
      >
        {board.map((row, r) =>
          row.map((tileType, c) => {
            const isPadding =
              r === 0 || r === TOTAL_ROWS - 1 || c === 0 || c === TOTAL_COLS - 1;

            // Nếu là ô đệm viền ngoài
            if (isPadding) {
              return (
                <div
                  key={`cell-${r}-${c}`}
                  className="w-full h-full pointer-events-none opacity-0"
                />
              );
            }

            // Nếu là ô trống đã bị ăn
            if (tileType === 0) {
              return (
                <div
                  key={`cell-${r}-${c}`}
                  className="w-full h-full pointer-events-none rounded-lg bg-slate-950/25 border border-slate-800/20 transition-all duration-200"
                />
              );
            }

            // Kiểm tra trạng thái đang được chọn
            const isSelected =
              selectedTile !== null &&
              selectedTile.r === r &&
              selectedTile.c === c;

            // Kiểm tra trạng thái nằm trong cặp gợi ý
            const isHint =
              hintPair !== null &&
              ((hintPair.p1.r === r && hintPair.p1.c === c) ||
                (hintPair.p2.r === r && hintPair.p2.c === c));

            const imgUrl = getTilePhotoUrl(tileType, customPhotos);
            const rotationAngle = rotations?.[r]?.[c] || 0;

            return (
              <button
                key={`tile-${r}-${c}`}
                type="button"
                onClick={() => onTileClick({ r, c })}
                className={`
                  group relative w-full h-full rounded-lg overflow-hidden transition-all duration-150 cursor-pointer
                  border-2 flex items-center justify-center
                  ${
                    isSelected
                      ? 'border-yellow-400 bg-amber-400/20 scale-105 z-20 shadow-[0_0_16px_rgba(250,204,21,0.7)]'
                      : isHint
                      ? 'border-emerald-400 bg-emerald-400/20 scale-105 z-20 animate-pulse shadow-[0_0_16px_rgba(52,211,153,0.7)]'
                      : 'border-slate-700/80 bg-slate-800/90 hover:border-amber-400/80 hover:scale-[1.03] hover:z-10 shadow-md'
                  }
                `}
                style={{
                  boxShadow: isSelected
                    ? '0 0 12px #facc15'
                    : isHint
                    ? '0 0 12px #34d399'
                    : 'inset 0 1px 1px rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                {/* Ảnh thẻ */}
                <img
                  src={imgUrl}
                  alt={`Thẻ ${tileType}`}
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = getDefaultAvatarUrl(tileType);
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                  style={{
                    transform: rotationAngle ? `rotate(${rotationAngle}deg)` : undefined,
                  }}
                  className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-200 group-hover:brightness-110"
                  loading="lazy"
                />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
