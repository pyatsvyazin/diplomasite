import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { createAdminUser } from '../../lib/api';

export default function AdminCreateUserModal({ open, onClose, onCreated }) {
  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRole('client');
      setError('');
    }
  }, [open]);

  if (!open || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createAdminUser({ full_name: fullName, email, phone, password, role });
      onCreated?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Ошибка создания пользователя');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal__close" onClick={onClose}>×</button>
        <h2 className="modal__title">Создать пользователя</h2>
        <form onSubmit={handleSubmit} className="admin-create-user-form">
          <label>
            ФИО
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Телефон
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label>
            Пароль
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </label>
          <label>
            Роль
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="client">Клиент</option>
              <option value="lawyer">Юрист</option>
              <option value="admin">Администратор</option>
            </select>
          </label>

          {error && <p className="modal__error">{error}</p>}

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={loading}>Отмена</button>
            <button type="submit" className="btn btn--primary" disabled={loading}>{loading ? '…' : 'Создать'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
