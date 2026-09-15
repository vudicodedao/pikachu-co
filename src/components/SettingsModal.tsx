import React, { useState } from 'react';
import { Settings, X, Music, Volume2, Clock, Sparkles, Shuffle, VolumeX } from 'lucide-react';
import { GameSettings } from '../types/game';

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  onClose: () => void;
  onSave: (newSettings: GameSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<GameSettings>(settings);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  const minutes = Math.round(form.stageTimeSeconds / 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cài đặt trò chơi</h2>
              <p className="text-xs text-slate-400">Tùy biến thời gian, quyền trợ giúp và âm thanh</p>
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

        {/* Nội dung cài đặt */}
        <div className="p-6 space-y-5 text-xs">
          {/* 1. Thời gian mỗi màn */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Thời gian mỗi màn:</span>
              </div>
              <span className="font-extrabold text-amber-300 text-sm">{minutes} phút ({form.stageTimeSeconds}s)</span>
            </div>
            <input
              type="range"
              min={60}
              max={1200}
              step={60}
              value={form.stageTimeSeconds}
              onChange={(e) => setForm({ ...form, stageTimeSeconds: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1 phút</span>
              <span>10 phút (chuẩn)</span>
              <span>20 phút</span>
            </div>
          </div>

          {/* 2. Số lượt Gợi ý (Min 5, Max 20) */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Số lần gợi ý (Hint):</span>
              </div>
              <span className="font-extrabold text-emerald-400 text-sm">{form.hintsCount} lượt</span>
            </div>
            <input
              type="range"
              min={5}
              max={20}
              step={1}
              value={form.hintsCount}
              onChange={(e) => setForm({ ...form, hintsCount: Number(e.target.value) })}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Tối thiểu: 5</span>
              <span>Mặc định: 10</span>
              <span>Tối đa: 20</span>
            </div>
          </div>

          {/* 3. Số lượt Đổi vị trí / Xáo bài (Min 5, Max 20) */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Shuffle className="w-4 h-4 text-indigo-400" />
                <span>Số lần đổi vị trí (Shuffle):</span>
              </div>
              <span className="font-extrabold text-indigo-400 text-sm">{form.shufflesCount} lượt</span>
            </div>
            <input
              type="range"
              min={5}
              max={20}
              step={1}
              value={form.shufflesCount}
              onChange={(e) => setForm({ ...form, shufflesCount: Number(e.target.value) })}
              className="w-full accent-indigo-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Tối thiểu: 5</span>
              <span>Mặc định: 10</span>
              <span>Tối đa: 20</span>
            </div>
          </div>

          {/* 4. Nhạc nền (BGM) */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Music className="w-4 h-4 text-rose-400" />
                <span>Nhạc nền (I could get used to days like this):</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.bgmEnabled}
                  onChange={(e) => setForm({ ...form, bgmEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>

            {/* Thanh âm lượng nhạc nền */}
            {form.bgmEnabled && (
              <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    {form.bgmVolume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    Âm lượng nhạc nền
                  </span>
                  <span className="font-bold text-rose-300">{Math.round(form.bgmVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={form.bgmVolume}
                  onChange={(e) => setForm({ ...form, bgmVolume: Number(e.target.value) })}
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/20"
          >
            Lưu & Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};
