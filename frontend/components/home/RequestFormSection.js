import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { submitRequest } from '../../lib/api';

export default function RequestFormSection() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = user
        ? { message: form.message }
        : { name: form.name, email: form.email, phone: form.phone, message: form.message };
      await submitRequest(payload);
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setError(err.message || 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="request-form-section">
      <h2 className="request-form-section__title">Заявка</h2>
      <form className="request-form-section__form" onSubmit={handleSubmit}>
        {user ? (
          <div className="request-form-section__profile">
            <div className="request-form-section__profile-avatar">
              {user.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="request-form-section__profile-info">
              <div className="request-form-section__profile-name">{user.full_name}</div>
              <div className="request-form-section__profile-meta">{user.email}</div>
              {user.phone && (
                <div className="request-form-section__profile-meta">{user.phone}</div>
              )}
            </div>
          </div>
        ) : (
          <>
            <label className="request-form-section__label">
              Имя
              <input
                type="text"
                name="name"
                className="request-form-section__input"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>
            <label className="request-form-section__label">
              Email
              <input
                type="email"
                name="email"
                className="request-form-section__input"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>
            <label className="request-form-section__label">
              Телефон
              <input
                type="tel"
                name="phone"
                className="request-form-section__input"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </label>
          </>
        )}
        <label className="request-form-section__label">
          Сообщение
          <textarea
            name="message"
            className="request-form-section__textarea"
            rows={4}
            value={form.message}
            onChange={handleChange}
            required
          />
        </label>
        {error && <p className="request-form-section__error">{error}</p>}
        {success && <p className="request-form-section__success">Заявка отправлена.</p>}
        <button type="submit" className="request-form-section__submit" disabled={loading}>
          {loading ? 'Отправка…' : 'Отправить заявку'}
        </button>
      </form>
    </section>
  );
}