export default function HeroSection() {
    const scrollToRequest = () => {
      const el = document.getElementById('request-form');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    };
  
    const steps = [
      'Вы оставляете заявку на нашем сайте',
      'Мы рассматриваем заявку и связываемся с вами для уточнения деталей',
      'Вы получаете консультацию и необходимое юридическое сопровождение',
      'Юридический вопрос решается или доводится до результата',
      'При необходимости оставляете отзыв о работе',
    ];
  
    return (
      <section className="hero block-section">
        <div className="hero__bg" aria-hidden />
        <div className="hero__inner">
          <div className="hero__content">
            <h1 className="hero__title">Юридическое агентство «Щит Справедливости»</h1>
            <p className="hero__subtitle">
              Профессиональная юридическая помощь для физических и юридических лиц
            </p>
            <p className="hero__text">
              Мы предоставляем квалифицированные консультации и сопровождение по широкому спектру правовых вопросов. Индивидуальный подход, прозрачные условия и современный онлайн-сервис.
            </p>
            <button type="button" className="hero__cta" onClick={scrollToRequest}>
              Консультация
            </button>
          </div>
          <div className="hero__steps-wrap">
            <div className="hero__steps-glass">
              <ul className="hero__steps-list">
                {steps.map((text, i) => (
                  <li key={i} className="hero__step">
                    <span className="hero__step-icon" aria-hidden />
                    <span className="hero__step-text">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    );
  }