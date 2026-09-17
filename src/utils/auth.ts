// Mã băm SHA-256 của mật khẩu mở khóa (Mật khẩu: 02102004)
const PASSWORD_HASH = '86cd41e965c450a1e9bbd2aa1e4179f3df189aae18a88f339bc21793704769ce';

const AUTH_STORAGE_KEY = 'phuong_portal_unlocked';

export async function hashString(str: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPasscode(code: string): Promise<boolean> {
  try {
    const hashed = await hashString(code.trim());
    return hashed === PASSWORD_HASH;
  } catch {
    return false;
  }
}

export function isAuthenticated(): boolean {
  try {
    return (
      localStorage.getItem(AUTH_STORAGE_KEY) === 'true' ||
      sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true'
    );
  } catch {
    return false;
  }
}

export function setAuthenticated(rememberDevice = true): void {
  try {
    if (rememberDevice) {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
    }
  } catch {
    // ignore
  }
}

export function lockPortal(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}
