export default function HeroSection() {
    const scrollToRequest = () => {
      const el = document.getElementById('request-form');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    };
  
    const steps = [
      { text: 'Вы оставляете заявку на нашем сайте', icon: '/icons/hero/apply.svg' },
      { text: 'Мы рассматриваем заявку и связываемся с вами для уточнения деталей', icon: '/icons/hero/phone-call.svg' },
      { text: 'Вы получаете консультацию и необходимое юридическое сопровождение', icon: '/icons/hero/person-support.svg' },
      { text: 'Юридический вопрос решается или доводится до результата', icon: '/icons/hero/law.svg' },
      { text: 'При необходимости оставляете отзыв о работе', icon: '/icons/hero/feedback-gesture-hand.svg' },
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
                {steps.map((step, i) => (
                  <li key={i} className="hero__step">
                    <span
                      className="hero__step-icon"
                      style={{ '--hero-step-icon': `url("${step.icon}")` }}
                      aria-hidden
                    />
                    <span className="hero__step-text">{step.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    );
  }