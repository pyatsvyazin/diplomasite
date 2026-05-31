import { getPasswordRuleStates } from '../lib/validation';

export default function PasswordRulesChecklist({ password, className = '' }) {
  const rules = getPasswordRuleStates(password);

  return (
    <ul className={`password-rules${className ? ` ${className}` : ''}`} aria-live="polite">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={`password-rules__item${rule.ok ? ' password-rules__item--ok' : ''}`}
        >
          <span className="password-rules__icon" aria-hidden>
            {rule.ok ? '✓' : '○'}
          </span>
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  );
}
