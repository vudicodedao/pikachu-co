import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Heart, Delete, RotateCcw, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BirdAvatar } from './BirdAvatar';
import { verifyPasscode, setAuthenticated } from '../utils/auth';
import { haptics } from '../utils/haptics';

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [inputCode, setInputCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShake, setIsShake] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  // Xử lý kiểm tra mã số
  const handleCheckCode = useCallback(
    async (codeToCheck: string) => {
      if (codeToCheck.length !== 8 || isVerifying) return;
      setIsVerifying(true);
      setErrorMsg(null);

      const isValid = await verifyPasscode(codeToCheck);
      if (isValid) {
        setIsSuccess(true);
        haptics.success();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.55 } });
        setAuthenticated(rememberDevice);

        setTimeout(() => {
          onUnlock();
        }, 600);
      } else {
        setIsShake(true);
        haptics.error();
        setErrorMsg('Mật khẩu chưa đúng rồi em bé ơi! Thử lại nha ❤️');
        setTimeout(() => {
          setIsShake(false);
          setInputCode('');
          setIsVerifying(false);
        }, 500);
      }
    },
    [isVerifying, onUnlock, rememberDevice]
  );

  // Thêm ký tự số
  const handleAddDigit = useCallback(
    (digit: string) => {
      if (inputCode.length >= 8 || isVerifying || isSuccess) return;
      haptics.tap();
      const nextCode = inputCode + digit;
      setInputCode(nextCode);
      setErrorMsg(null);

      if (nextCode.length === 8) {
        handleCheckCode(nextCode);
      }
    },
    [inputCode, isVerifying, isSuccess, handleCheckCode]
  );

  // Xóa 1 ký tự
  const handleDelete = useCallback(() => {
    if (isVerifying || isSuccess) return;
    haptics.tap();
    setInputCode((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  }, [isVerifying, isSuccess]);

  // Xóa toàn bộ
  const handleClear = useCallback(() => {
    if (isVerifying || isSuccess) return;
    haptics.tap();
    setInputCode('');
    setErrorMsg(null);
  }, [isVerifying, isSuccess]);

  // Hỗ trợ nhập trực tiếp từ bàn phím máy tính
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleAddDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAddDigit, handleDelete, handleClear]);

  return (
    <div className="w-screen min-h-dvh h-dvh bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-3 sm:p-4 select-none relative overflow-y-auto overscroll-none">
      {/* Nền hiệu ứng ánh sáng gradient hồng tím lung linh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(244,63,94,0.18),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_120%,rgba(168,85,247,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* KHUNG BẢO MẬT CHÍNH */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center space-y-3 sm:space-y-4 my-auto animate-fadeIn">
        {/* Logo Chú chim Mascot */}
        <div className="p-1.5 sm:p-2 rounded-3xl bg-slate-900/90 border-2 border-rose-500/40 shadow-2xl shadow-rose-500/20 backdrop-blur-md relative">
          <BirdAvatar size={66} animate={true} />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Tiêu đề & Lời nhắn */}
        <div>
          <h1 className="text-xl sm:text-3xl font-black font-arcade text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-400 to-pink-400 drop-shadow-[0_2px_12px_rgba(244,63,94,0.4)]">
            My baby Phuong
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 flex items-center justify-center gap-1.5">
            <span>Khu Vực Riêng Tư Của Em Bé Iu</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            Vui lòng nhập ngày đặc biệt (8 số DDMMYYYY) để mở khóa
          </p>
        </div>

        {/* CÁC CHẤM TRÒN MẬT MÃ (8 CHẤM) */}
        <div
          className={`flex items-center justify-center gap-2.5 py-2 px-4 rounded-2xl bg-slate-900/80 border border-slate-800 transition-transform ${
            isShake ? 'animate-shake' : ''
          }`}
        >
          {Array.from({ length: 8 }).map((_, idx) => {
            const isFilled = idx < inputCode.length;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                  isSuccess
                    ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_10px_#34d399] scale-110'
                    : isFilled
                    ? 'bg-rose-500 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.7)] scale-110'
                    : 'bg-slate-950 border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Thông báo lỗi nếu sai */}
        {errorMsg && (
          <div className="text-xs font-bold text-rose-400 flex items-center justify-center gap-1 animate-fadeIn">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* BÀN PHÍM SỐ CẢM ỨNG (KEYPAD 0-9) */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px] pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleAddDigit(digit)}
              className="h-14 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-rose-500 border border-slate-800 hover:border-rose-500/50 active:border-rose-400 text-xl font-bold text-slate-200 active:text-white transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer font-arcade"
            >
              {digit}
            </button>
          ))}

          {/* Phím Xóa hết (Clear) */}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center cursor-pointer text-xs font-bold active:scale-95"
            title="Xóa hết"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Phím số 0 */}
          <button
            type="button"
            onClick={() => handleAddDigit('0')}
            className="h-14 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-rose-500 border border-slate-800 hover:border-rose-500/50 active:border-rose-400 text-xl font-bold text-slate-200 active:text-white transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer font-arcade"
          >
            0
          </button>

          {/* Phím Xóa 1 số (Backspace) */}
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center cursor-pointer active:scale-95"
            title="Xóa một số"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Tùy chọn Ghi nhớ trên thiết bị này */}
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-300 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={rememberDevice}
            onChange={(e) => setRememberDevice(e.target.checked)}
            className="rounded border-slate-700 text-rose-500 focus:ring-rose-500/30 accent-rose-500 cursor-pointer"
          />
          <span>Ghi nhớ mở khóa trên thiết bị này</span>
        </label>
      </div>

      {/* FOOTER */}
      <footer className="absolute bottom-3 text-center text-[10px] text-slate-600 font-medium">
        © 2026 My baby Phượng • Bảo mật riêng tư
      </footer>
    </div>
  );
};
