import React, { useState, useRef } from 'react';
import {
  Upload,
  Trash2,
  X,
  CheckCircle2,
  HelpCircle,
  FolderInput,
  ImagePlus,
  Save,
} from 'lucide-react';
import { NUM_DISTINCT_TILES } from '../core/algorithm';
import {
  importBatchPhotos,
  clearAllCustomPhotos,
  saveSinglePhoto,
  removeSinglePhoto,
  getTilePhotoUrl,
  syncPhotosToProjectDisk,
} from '../utils/photoStorage';

interface PhotoManagerModalProps {
  isOpen: boolean;
  customPhotos: Record<number, string>;
  onClose: () => void;
  onPhotosUpdated: (photos: Record<number, string>) => void;
}

export const PhotoManagerModal: React.FC<PhotoManagerModalProps> = ({
  isOpen,
  customPhotos,
  onClose,
  onPhotosUpdated,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [replaceAll, setReplaceAll] = useState(false);
  const [selectedSlotForSingleUpload, setSelectedSlotForSingleUpload] = useState<number | null>(null);

  const batchFileInputRef = useRef<HTMLInputElement | null>(null);
  const singleFileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const uploadedCount = Object.keys(customPhotos).length;

  // Xử lý nạp hàng loạt ảnh
  const handleBatchFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setStatusMsg('Đang xử lý cắt vuông tâm và tối ưu hóa ảnh...');

    try {
      const fileArr = Array.from(files).filter(
        (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif)$/i.test(f.name)
      );

      if (fileArr.length === 0) {
        setStatusMsg('Không tìm thấy file ảnh hợp lệ. Vui lòng chọn file .jpg, .png, .webp.');
        setIsProcessing(false);
        return;
      }

      const result = await importBatchPhotos(fileArr, replaceAll);
      onPhotosUpdated(result.photos);

      if (result.failedCount > 0) {
        setStatusMsg(
          `Đã nạp thành công ${result.successCount} ảnh (${result.failedCount} file lỗi bị bỏ qua).`
        );
      } else {
        setStatusMsg(`Đã nạp thành công toàn bộ ${result.successCount} ảnh vào trò chơi!`);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('Có lỗi xảy ra khi nạp ảnh. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Xử lý chọn ảnh riêng lẻ cho 1 ô cụ thể
  const handleSingleSlotClick = (slotId: number) => {
    setSelectedSlotForSingleUpload(slotId);
    if (singleFileInputRef.current) {
      singleFileInputRef.current.value = '';
      singleFileInputRef.current.click();
    }
  };

  const handleSingleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedSlotForSingleUpload === null) return;

    setIsProcessing(true);
    try {
      const dataUrl = await saveSinglePhoto(selectedSlotForSingleUpload, file);
      onPhotosUpdated({
        ...customPhotos,
        [selectedSlotForSingleUpload]: dataUrl,
      });
      setStatusMsg(`Đã cập nhật ảnh riêng cho ô số ${selectedSlotForSingleUpload}!`);
    } catch (err) {
      console.error(err);
      setStatusMsg(`Lỗi cập nhật ảnh ô ${selectedSlotForSingleUpload}.`);
    } finally {
      setIsProcessing(false);
      setSelectedSlotForSingleUpload(null);
    }
  };

  // Xóa 1 ảnh lẻ
  const handleRemoveSingle = async (slotId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeSinglePhoto(slotId);
      const next = { ...customPhotos };
      delete next[slotId];
      onPhotosUpdated(next);
      setStatusMsg(`Đã đưa ô số ${slotId} về biểu tượng mặc định.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Xóa toàn bộ
  const handleClearAll = async () => {
    if (
      window.confirm(
        'Bạn có chắc muốn xóa toàn bộ ảnh tùy chỉnh và quay về bộ biểu tượng mặc định?'
      )
    ) {
      setIsProcessing(true);
      await clearAllCustomPhotos();
      onPhotosUpdated({});
      setStatusMsg('Đã xóa toàn bộ ảnh tùy chỉnh.');
      setIsProcessing(false);
    }
  };

  // Đồng bộ ảnh vào thư mục dự án public/photos/
  const handleSyncToDisk = async () => {
    setIsProcessing(true);
    setStatusMsg('Đang lưu các ảnh vào thư mục public/photos của dự án...');
    const res = await syncPhotosToProjectDisk(customPhotos);
    setIsProcessing(false);
    if (res.success) {
      setStatusMsg(`✓ Đã lưu thành công ${res.count} ảnh vào thư mục public/photos/! Sẵn sàng đóng gói.`);
    } else {
      setStatusMsg('Lưu ảnh thất bại. Hãy đảm bảo máy chủ dev đang chạy.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Input file ẩn cho nạp lẻ từng ô */}
        <input
          ref={singleFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSingleFileChange}
        />

        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Quản lý ảnh trò chơi (36 Ảnh)
              </h2>
              <p className="text-xs text-slate-400">
                Tự động cắt vuông tâm, nén nhẹ và lưu trực tiếp trong trình duyệt
              </p>
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

        {/* Nội dung chính cuộn được */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Khu vực Drag & Drop */}
          <div
            onClick={() => batchFileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleBatchFiles(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-slate-700 hover:border-amber-400/80 bg-slate-950/50 hover:bg-slate-950/80 rounded-xl p-5 text-center cursor-pointer transition-all duration-200 group"
          >
            <input
              ref={batchFileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleBatchFiles(e.target.files)}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-slate-800 text-slate-300 group-hover:bg-amber-400/20 group-hover:text-amber-300 transition-colors">
                <FolderInput className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Kéo thả các ảnh vào đây hoặc click để chọn nạp hàng loạt
              </p>
              <p className="text-xs text-slate-400">
                (Hỗ trợ nạp nhiều ảnh cùng lúc hoặc từng đợt, hệ thống sẽ tự động điền tiếp vào các ô còn trống)
              </p>
            </div>
          </div>

          {/* Tùy chọn nạp: Nối tiếp hay Ghi đè */}
          <div className="flex items-center justify-between text-xs px-2 py-1.5 bg-slate-950/40 rounded-lg border border-slate-800">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={replaceAll}
                onChange={(e) => setReplaceAll(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-600 text-amber-500 focus:ring-0 cursor-pointer"
              />
              <span>Ghi đè lại toàn bộ từ ô số 1 (xóa các ảnh cũ đã nạp)</span>
            </label>
            <span className="text-slate-400 text-[11px]">
              Mặc định: Tự động điền tiếp vào ô còn trống
            </span>
          </div>

          {/* Trạng thái / Thông báo */}
          {statusMsg && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Thống kê ảnh */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-300 font-medium">
              Đã nạp:{' '}
              <strong className="text-amber-400">{uploadedCount}</strong> / 36 ô (Còn trống: {36 - uploadedCount} ô)
            </span>
            {uploadedCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isProcessing}
                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa toàn bộ ảnh tùy chỉnh</span>
              </button>
            )}
          </div>

          {/* Lưới xem trước và gán lẻ từng ô trong 36 ô */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Bấm trực tiếp vào từng ô dưới đây để thay ảnh lẻ cho ô đó:</span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
              {Array.from({ length: NUM_DISTINCT_TILES }).map((_, idx) => {
                const typeId = idx + 1;
                const hasCustom = Boolean(customPhotos[typeId]);
                const imgUrl = getTilePhotoUrl(typeId, customPhotos);

                return (
                  <div
                    key={`preview-${typeId}`}
                    onClick={() => handleSingleSlotClick(typeId)}
                    className={`
                      group relative aspect-square rounded-lg border overflow-hidden cursor-pointer transition-all duration-150
                      ${
                        hasCustom
                          ? 'border-emerald-500/70 bg-emerald-950/20 hover:border-emerald-400 hover:scale-105'
                          : 'border-slate-800 bg-slate-900 hover:border-amber-400/80 hover:scale-105'
                      }
                    `}
                    title={`Ô số #${typeId}: Bấm để chọn ảnh`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Ô ${typeId}`}
                      className="w-full h-full object-cover group-hover:brightness-110"
                    />

                    {/* Số thứ tự ô */}
                    <span className="absolute bottom-0.5 right-0.5 px-1 text-[8px] font-bold bg-black/80 text-slate-200 rounded">
                      {typeId}
                    </span>

                    {/* Dấu chấm xanh nếu đã nạp ảnh tùy chỉnh */}
                    {hasCustom && (
                      <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black" />
                    )}

                    {/* Hover overlay với nút thay ảnh / xóa */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                      <div className="p-1 rounded bg-slate-800 text-amber-300">
                        <ImagePlus className="w-3.5 h-3.5" />
                      </div>
                      {hasCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSingle(typeId, e)}
                          className="p-1 rounded bg-rose-900 text-rose-300 hover:bg-rose-800"
                          title="Xóa ảnh ô này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ghi chú */}
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <HelpCircle className="w-4 h-4" />
              <span>Mẹo nạp ảnh:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li>
                Bạn có thể nạp từng đợt vài ảnh một. Hệ thống sẽ ghi nhớ và xếp tiếp vào các ô từ 1 đến 36 mà không ghi đè ô cũ.
              </li>
              <li>
                Để thay đổi ảnh của một ô bất kỳ, bạn chỉ cần <strong>click thẳng vào ô đó</strong> trong bảng 36 ô ở trên.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 gap-3">
          <div>
            {uploadedCount > 0 && (
              <button
                type="button"
                onClick={handleSyncToDisk}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <Save className="w-4 h-4" />
                <span>Lưu {uploadedCount} ảnh thành bộ gốc cho Web</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/20"
          >
            Đóng & Bắt đầu chơi
          </button>
        </div>
      </div>
    </div>
  );
};
