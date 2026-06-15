/** Validation helpers cho lead form — hàm thuần, không side-effect. */

// Định dạng email cơ bản: có local, @, domain với ít nhất một dấu chấm.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Danh sách domain email dùng-1-lần phổ biến (mở rộng khi cần).
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "tempmail.com",
  "trashmail.com",
  "yopmail.com",
  "getnada.com",
  "throwawaymail.com",
]);

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isDisposableEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return DISPOSABLE_DOMAINS.has(domain);
}

export function isValidVNPhone(phone: string): boolean {
  const digits = phone.replace(/\s+/g, "");
  // +84 theo sau 9 chữ số, hoặc 0 theo sau 9 chữ số (tổng 10).
  return /^(\+84|0)\d{9}$/.test(digits);
}
