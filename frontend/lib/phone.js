/**
 * Формат отображения: +7 (XXX) XXX-XX-XX
 * В state и в API — только цифры (до 11 символов, для номера РФ начинается с 7).
 */

/**
 * Нормализует строку до «только цифры», макс 11. 8 в начале заменяется на 7.
 * Для отображения и хранения в форме.
 */
export function normalizeDigits(str) {
  if (str == null || str === '') return '';
  let digits = String(str).replace(/\D/g, '').slice(0, 11);
  if (digits.length === 11 && digits[0] === '8') digits = '7' + digits.slice(1);
  return digits;
}

/**
 * Форматирует строку из цифр для отображения в поле: +7 (XXX) XXX-XX-XX.
 * Принимает только цифры (уже нормализованные). Не дублирует 7 в начале.
 */
export function formatPhone(digitsOrNull) {
  const digits = normalizeDigits(digitsOrNull);
  if (digits === '') return '';
  // «Тело» номера без ведущей 7 (чтобы не показывать +7 (7 при вводе первой 7)
  const body = digits[0] === '7' ? digits.slice(1) : digits;
  const len = body.length;
  if (len === 0) return '+7 (';
  if (len <= 3) return `+7 (${body}`;
  if (len <= 6) return `+7 (${body.slice(0, 3)}) ${body.slice(3)}`;
  if (len <= 8) return `+7 (${body.slice(0, 3)}) ${body.slice(3, 6)}-${body.slice(6)}`;
  return `+7 (${body.slice(0, 3)}) ${body.slice(3, 6)}-${body.slice(6, 8)}-${body.slice(8, 10)}`;
}

/**
 * Из ввода (форматированная строка или цифры) получает строку только из цифр для хранения.
 */
export function parsePhoneToDigits(str) {
  const digits = normalizeDigits(str);
  if (digits.length === 10 && digits[0] !== '7') return '7' + digits;
  return digits;
}

/**
 * Проверка: полный номер РФ 7XXXXXXXXXX.
 */
export function isValidPhoneDigits(str) {
  const digits = parsePhoneToDigits(str);
  return /^7\d{10}$/.test(digits);
}
