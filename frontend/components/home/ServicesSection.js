import { useState } from 'react';

const SERVICES_INDIVIDUALS = [
  {
    title: 'Семейные дела',
    items: [
      'Взыскание алиментов',
      'Изменение размера алиментов',
      'Расторжение брака',
      'Лишение и ограничение родительских прав',
    ],
  },
  {
    title: 'Вопросы недвижимости',
    items: [
      'Полное сопровождение сделок недвижимым имуществом',
      'Приватизация квартир',
      'Получение разрешений на строительство',
    ],
  },
  {
    title: 'Трудовые споры',
    items: [
      'Взыскание заработной платы',
      'Подготовка работодателя к проверкам',
      'Взыскание зарплаты и компенсаций',
      'Восстановление на работе',
    ],
  },
];

const SERVICES_BUSINESS = [
  { title: 'Заголовок', items: ['Ссылка', 'Ссылка', 'Ссылка'] },
  { title: 'Заголовок', items: ['Ссылка', 'Ссылка'] },
  { title: 'Заголовок', items: ['Ссылка', 'Ссылка', 'Ссылка'] },
];

export default function ServicesSection() {
  const [activeTab, setActiveTab] = useState('individuals');

  const blocks = activeTab === 'individuals' ? SERVICES_INDIVIDUALS : SERVICES_BUSINESS;

  return (
    <section className="services-section">
      <div className="services-section__inner">
      <div className="services-section__panel">
          <h2 className="services-section__title">Наши услуги</h2>
          <p className="services-section__text">
            Текст об услугах, которые предоставляет компания.
          </p>
          <div className="services-section__buttons">
            <button
              type="button"
              className={`services-section__btn ${activeTab === 'individuals' ? 'services-section__btn--active' : ''}`}
              onClick={() => setActiveTab('individuals')}
            >
              Для физ. лиц
            </button>
            <button
              type="button"
              className={`services-section__btn ${activeTab === 'business' ? 'services-section__btn--active' : ''}`}
              onClick={() => setActiveTab('business')}
            >
              Для бизнеса
            </button>
          </div>
        </div>
        <div className="services-section__content">
          {blocks.map((block, idx) => (
            <div key={idx} className="services-section__block">
              <h3 className="services-section__block-title">{block.title}</h3>
              <ul className="services-section__list">
                {block.items.map((item, i) => (
                  <li key={i} className="services-section__item">
                    <a href="#" className="services-section__link" onClick={(e) => e.preventDefault()}>
                      {item}
                      <span className="services-section__arrow">›</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}