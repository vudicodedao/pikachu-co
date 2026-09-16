import React from 'react';
import { Trophy, Medal, X, Trash2, Calendar, Clock } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';

interface LeaderboardModalProps {
  isOpen: boolean;
  entries: LeaderboardEntry[];
  onClose: () => void;
  onClear: () => void;
  title?: string;
  subtitle?: string;
  scoreColumnLabel?: string;
  stageColumnLabel?: string;
  stageBadgePrefix?: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  entries,
  onClose,
  onClear,
  title = 'Bảng xếp hạng kỷ lục',
  subtitle = 'Lịch sử thành tích cao nhất của Em bé iu',
  scoreColumnLabel = 'Điểm số',
  stageColumnLabel = 'Màn đạt được',
  stageBadgePrefix = 'Màn',
}) => {
  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-normal">
                  Tối đa 20 lượt chơi
                </span>
              </h2>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung danh sách */}
        <div className="flex-1 overflow-y-auto p-6">
          {entries.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Medal className="w-12 h-12 mx-auto text-slate-600 opacity-50 stroke-1" />
              <p className="text-sm">Chưa có lượt chơi nào được ghi nhận.</p>
              <p className="text-xs text-slate-600">Hãy hoàn thành hoặc kết thúc một ván để lưu điểm nhé!</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/50">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                    <th className="py-3 px-4 w-16 text-center">Hạng</th>
                    <th className="py-3 px-4">{scoreColumnLabel}</th>
                    <th className="py-3 px-4">{stageColumnLabel}</th>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4 text-right">Ngày giờ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {entries.map((item, idx) => {
                    const isTop1 = idx === 0;
                    const isTop2 = idx === 1;
                    const isTop3 = idx === 2;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors hover:bg-slate-800/40 ${
                          isTop1
                            ? 'bg-amber-500/10 font-medium'
                            : isTop2
                            ? 'bg-slate-400/5'
                            : isTop3
                            ? 'bg-amber-700/5'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          {isTop1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-yellow-500/30">
                              1
                            </span>
                          ) : isTop2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs">
                              2
                            </span>
                          ) : isTop3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-bold text-xs">
                              3
                            </span>
                          ) : (
                            <span className="text-slate-500 font-semibold">{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-amber-300 text-sm">
                            {item.score.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 font-semibold">
                            {stageBadgePrefix} {item.stageReached}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{formatDuration(item.timeSpentSeconds)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400">
                          <div className="flex items-center justify-end gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{item.date}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs">
          <button
            type="button"
            onClick={onClear}
            disabled={entries.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa lịch sử</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
