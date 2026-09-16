import { getDefaultAvatarUrl } from './defaultAvatars';
import { NUM_DISTINCT_TILES } from '../core/algorithm';

export { NUM_DISTINCT_TILES, getDefaultAvatarUrl };

const DB_NAME = 'PikachuGameDB';
const DB_VERSION = 1;
const STORE_NAME = 'customPhotos';

// Khởi tạo IndexedDB lưu trữ ảnh bạn gái của người dùng
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Lấy tất cả ảnh tùy chỉnh từ IndexedDB
export async function getAllCustomPhotos(): Promise<Record<number, string>> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const result: Record<number, string> = {};
        const items = request.result as { id: number; dataUrl: string }[];
        items.forEach((item) => {
          result[item.id] = item.dataUrl;
        });
        resolve(result);
      };
      request.onerror = () => resolve({});
    });
  } catch {
    return {};
  }
}

// Lưu 1 ảnh vào IndexedDB theo ID cụ thể
export async function savePhoto(id: number, dataUrl: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put({ id, dataUrl });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Xóa 1 ảnh cụ thể khỏi IndexedDB
export async function removeSinglePhoto(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Xóa toàn bộ ảnh tùy chỉnh (quay về mặc định)
export async function clearAllCustomPhotos(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Pipeline xử lý ảnh: Cắt vuông tâm (Center-Crop) và nén chuẩn về độ nét cao (HD 360x360px) bằng HTML5 Canvas
export function cropAndResizeImage(file: File, targetSize = 360): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context không khả dụng'));
            return;
          }

          // Tính toán tọa độ cắt vuông tâm (Center Crop)
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);

          // Xuất ra định dạng jpeg nén
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Không thể tải dữ liệu ảnh'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Không thể đọc file'));
    reader.readAsDataURL(file);
  });
}

// Nạp 1 ảnh đơn lẻ cho 1 slot cụ thể
export async function saveSinglePhoto(slotId: number, file: File): Promise<string> {
  const dataUrl = await cropAndResizeImage(file);
  await savePhoto(slotId, dataUrl);
  return dataUrl;
}

export interface BatchImportResult {
  photos: Record<number, string>;
  successCount: number;
  failedCount: number;
}

// Nạp thông minh hàng loạt: tự động điền vào các ô trống tiếp theo hoặc ghi đè từ 1 nếu chọn thay thế
export async function importBatchPhotos(
  files: File[],
  replaceAll = false
): Promise<BatchImportResult> {
  const existing = replaceAll ? {} : await getAllCustomPhotos();
  if (replaceAll) {
    await clearAllCustomPhotos();
  }

  // Tìm danh sách các slot còn trống (1..36)
  const emptySlots: number[] = [];
  for (let i = 1; i <= NUM_DISTINCT_TILES; i++) {
    if (!existing[i]) {
      emptySlots.push(i);
    }
  }

  // Nếu không còn ô trống nào hoặc chế độ replaceAll, sử dụng thứ tự 1..36
  const targetSlots: number[] =
    emptySlots.length > 0
      ? [...emptySlots]
      : Array.from({ length: NUM_DISTINCT_TILES }, (_, idx) => idx + 1);

  let successCount = 0;
  let failedCount = 0;
  let slotIndex = 0;

  for (let f = 0; f < files.length; f++) {
    if (slotIndex >= targetSlots.length) break;
    const file = files[f];
    const slotId = targetSlots[slotIndex];

    try {
      const dataUrl = await cropAndResizeImage(file);
      await savePhoto(slotId, dataUrl);
      existing[slotId] = dataUrl;
      successCount++;
      slotIndex++;
    } catch (err) {
      console.warn(`Lỗi xử lý file ${file.name}:`, err);
      failedCount++;
    }
  }

  return {
    photos: existing,
    successCount,
    failedCount,
  };
}

// Đồng bộ ảnh từ IndexedDB vào thư mục public/photos của dự án qua API nội bộ
export async function syncPhotosToProjectDisk(
  photos: Record<number, string>
): Promise<{ success: boolean; count: number }> {
  try {
    const res = await fetch('/api/sync-photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photos),
    });
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi đồng bộ ảnh vào dự án:', err);
    return { success: false, count: 0 };
  }
}

// Lấy URL ảnh hiển thị cho 1 loại thẻ (type 1..36)
export function getTilePhotoUrl(
  typeId: number,
  customPhotos: Record<number, string>
): string {
  // 1. Kiểm tra ảnh trong IndexedDB do người dùng nạp qua giao diện
  if (customPhotos[typeId]) {
    return customPhotos[typeId];
  }
  // 2. Mặc định ưu tiên file tĩnh trong thư mục public/photos/
  const baseUrl = import.meta.env.BASE_URL || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${cleanBase}photos/${typeId}.jpg`;
}
