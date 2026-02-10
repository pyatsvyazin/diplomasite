import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { submitRequest } from '../../lib/api';
import { REQUEST_TOPICS } from '../../constants/requestTopics';
import Avatar from '../Avatar';
import { getAvatarUrl } from '../../lib/api';

export default function RequestFormSection() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', subject: '', message: ''
  });
  const [customTopic, setCustomTopic] = useState('');
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
    const subjectValue = form.subject === '__other__' ? customTopic.trim() : form.subject;
    if (form.subject === '__other__' && !customTopic.trim()) {
      setError('Укажите тему.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const payload = user
        ? { subject: subjectValue, message: form.message }
        : { name: form.name, email: form.email, phone: form.phone, subject: subjectValue, message: form.message };
      await submitRequest(payload);
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setCustomTopic('');
    } catch (err) {
      setError(err.message || 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="request-form" className="request-form-section">
      <h2 className="request-form-section__title">Заявка</h2>
      <form className="request-form-section__form" onSubmit={handleSubmit}>
        {user ? (
          <div className="request-form-section__profile">
            <Avatar name={user.full_name} size="lg" className="request-form-section__profile-avatar" src={getAvatarUrl(user)} />
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
          Тема
          <select
            name="subject"
            className="request-form-section__input"
            value={form.subject}
            onChange={(e) => {
              const v = e.target.value;
              setForm((prev) => ({ ...prev, subject: v }));
              if (v !== '__other__') setCustomTopic('');
            }}
            required
          >
            <option value="">Выберите тему</option>
            {REQUEST_TOPICS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
            <option value="__other__">Другое (указать свою)</option>
          </select>
          {form.subject === '__other__' && (
            <input
              type="text"
              className="request-form-section__input"
              placeholder="Введите свою тему"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              required={form.subject === '__other__'}
            />
          )}
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