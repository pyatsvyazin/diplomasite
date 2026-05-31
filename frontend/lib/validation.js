export const PASSWORD_RULES = [
  {
    id: 'length',
    label: 'Не менее 8 символов',
    test: (p) => (p || '').length >= 8,
  },
  {
    id: 'digit',
    label: 'Минимум одна цифра',
    test: (p) => /[0-9]/.test(p || ''),
  },
  {
    id: 'special',
    label: 'Минимум один спецсимвол',
    test: (p) => /[^a-zA-Zа-яА-ЯёЁ0-9\s]/.test(p || ''),
  },
];

export function getPasswordRuleStates(password) {
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    ok: rule.test(password),
  }));
}

export function validatePassword(password) {
  const failed = PASSWORD_RULES.find((r) => !r.test(password));
  if (!failed) return '';
  if (failed.id === 'length') return 'Пароль не менее 8 символов.';
  if (failed.id === 'digit') return 'Добавьте минимум одну цифру.';
  return 'Добавьте минимум один спецсимвол (!@#$%^&* и т.д.).';
}

/** Пароль по правилам и совпадает с подтверждением (подтверждение не пустое). */
export function isPasswordPairReady(password, confirmation) {
  return !validatePassword(password) && (confirmation || '').length > 0 && password === confirmation;
}
