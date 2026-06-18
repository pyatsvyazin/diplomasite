import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { submitRequest } from '../../lib/api';
import { notifyAdminBadgeRefresh } from '../../lib/adminEvents';
import { formatPhone, normalizeDigits, parsePhoneToDigits, isValidPhoneDigits } from '../../lib/phone';
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
    if (name === 'phone') {
      setForm((prev) => ({ ...prev, phone: formatPhone(normalizeDigits(value)) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const subjectValue = form.subject === '__other__' ? customTopic.trim() : form.subject;
    if (form.subject === '__other__' && !customTopic.trim()) {
      setError('Укажите тему.');
      return;
    }
    if (!user && !isValidPhoneDigits(form.phone)) {
      setError('Укажите номер в формате +7 (XXX) XXX-XX-XX.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const payload = user
        ? { subject: subjectValue, message: form.message }
        : {
            name: form.name,
            email: form.email,
            phone: parsePhoneToDigits(form.phone),
            subject: subjectValue,
            message: form.message,
          };
      await submitRequest(payload);
      notifyAdminBadgeRefresh();
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
      <h2 className="request-form-section__title">Завка и контакты</h2>
      <div className="request-form-section__grid">
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
          ) : null}
          {!user ? (
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
                  placeholder="+7 (9XX) XXX-XX-XX"
                  required
                />
              </label>
            </>
          ) : null}
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

        <aside className="request-form-section__contacts">
          <div className="request-form-section__contact-item">
            <img src="/icons/map-location.svg" alt="" className="request-form-section__contact-icon" aria-hidden />
            <span>Большой Спасоглинищевский пер., 5/4 строение 11,Москва, 101000</span>
          </div>
          <div className="request-form-section__contact-item">
            <img src="/icons/phone-number.svg" alt="" className="request-form-section__contact-icon" aria-hidden />
            <span>+7(900)000-00-00</span>
          </div>
          <div className="request-form-section__contact-item">
            <img src="/icons/mail.svg" alt="" className="request-form-section__contact-icon" aria-hidden />
            <span>legalshield@mail.ru</span>
          </div>

          <div className="request-form-section__map-wrap">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d1322.1676007453639!2d37.635238535755924!3d55.756378818354804!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1z0L7RhNC40YEg0LrQvtC80L_QsNC90LjQuA!5e0!3m2!1sru!2sru!4v1778074907049!5m2!1sru!2sru"
              width="600"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Карта офиса"
            />
          </div>
        </aside>
      </div>
    </section>
  );
}