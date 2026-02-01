import { useState } from 'react';
import { submitRequest } from '../../lib/api';

export default function RequestFormSection() {
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
      await submitRequest(form);
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