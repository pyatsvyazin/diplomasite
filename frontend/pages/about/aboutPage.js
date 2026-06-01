import Link from 'next/link';
import HeroSection from '../../components/home/HeroSection';
import StaffSection from '../../components/home/StaffSection';
import HomeFooter from '../../components/home/HomeFooter';

const VALUES = [
  {
    title: 'Прозрачность',
    text: 'Мы заранее проговариваем возможные сценарии, ориентировочные сроки и порядок оплаты. Вы понимаете, за что платите и что будет происходить на каждом этапе — без сюрпризов в договоре и в переписке.',
  },
  {
    title: 'Индивидуальный подход',
    text: 'Каждое обращение рассматривается отдельно: мы не подставляем «шаблонный» ответ, а подбираем юриста под тематику дела и масштаб задачи — от разовой консультации до длительного сопровождения.',
  },
  {
    title: 'Современный сервис',
    text: 'Заявка, чат с юристом, назначение консультаций и уведомления о статусе — в личном кабинете. Можно вести дело дистанционно, а при необходимости приехать в офис на встречу.',
  },
  {
    title: 'Ориентация на результат',
    text: 'Наша цель — не формальный ответ, а понятный итог: соглашение с контрагентом, выигранный спор, восстановленное право или чёткий план, если суд пока не требуется.',
  },
];

const SERVICE_LINKS = [
  {
    href: '/services/individuals',
    title: 'Для физических лиц',
    desc: 'Семейные, жилищные, трудовые и гражданские вопросы, защита в суде и досудебное урегулирование.',
    tag: 'Частным клиентам',
  },
  {
    href: '/services/business',
    title: 'Для бизнеса',
    desc: 'Договоры, претензии, кадры, налоги, корпоративные споры и абонентское сопровождение компаний.',
    tag: 'ИП и организациям',
  },
];

export default function AboutPage() {
  const scrollToContacts = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/contacts#request-form';
    }
  };

  return (
    <div className="page about-page">
      <HeroSection />

      <section className="about-hero block-section" aria-labelledby="about-title">
        <div className="about-hero__inner">
          <div className="about-hero__main">
            <h1 id="about-title" className="about-hero__title">
              О нас
            </h1>
            <p className="about-hero__lead">
              Юридическое агентство «Щит Справедливости» — это команда практикующих специалистов, которая
              сопровождает частных клиентов и бизнес в повседневных и нестандартных правовых ситуациях.
            </p>
            <p className="about-hero__text">
              Мы созданы для того, чтобы юридическая помощь была не абстрактной «консультацией на час», а
              понятным процессом: от первого обращения до итога, который можно измерить — подписанным
              соглашением, решением суда, урегулированным спором или чётким алгоритмом действий на ближайшие
              недели.
            </p>
            <p className="about-hero__text">
              В работе сочетаем классическую юридическую экспертизу и удобный цифровой сервис: заявки,
              переписка с юристом, назначение встреч и уведомления о статусе доступны в личном кабинете. Так
              проще контролировать ход дела, не терять документы в переписке и быть на связи, даже если вы в
              другом городе.
            </p>
            <p className="about-hero__text">
              Мы сопровождаем клиентов по широкому спектру вопросов — от семейных и трудовых споров до
              договорной работы, претензий и представительства интересов компании. На каждом этапе объясняем
              правовую логику простым языком и предлагаем варианты с учётом рисков, сроков и ваших приоритетов.
            </p>
          </div>

          <ul className="about-hero__facts" aria-label="Ключевые факты">
            <li className="about-hero__fact">
              <span className="about-hero__fact-value">10+</span>
              <span className="about-hero__fact-label">направлений права в практике агентства</span>
            </li>
            <li className="about-hero__fact">
              <span className="about-hero__fact-value">Онлайн</span>
              <span className="about-hero__fact-label">консультации, чаты и уведомления в кабинете</span>
            </li>
            <li className="about-hero__fact">
              <span className="about-hero__fact-value">B2C и B2B</span>
              <span className="about-hero__fact-label">физлица, ИП и организации</span>
            </li>
          </ul>

          <div className="about-hero__services">
            <h2 className="about-hero__services-title">Наши услуги</h2>
            <p className="about-hero__services-lead">
              Выберите раздел с актуальным перечнем и описанием — так проще найти направление под вашу задачу.
            </p>
            <div className="about-service-cards">
              {SERVICE_LINKS.map((item) => (
                <Link key={item.href} href={item.href} className="about-service-card">
                  <span className="about-service-card__tag">{item.tag}</span>
                  <span className="about-service-card__title">{item.title}</span>
                  <span className="about-service-card__desc">{item.desc}</span>
                  <span className="about-service-card__action">
                    Смотреть услуги
                    <img src="/icons/arrow.svg" alt="" className="about-service-card__arrow" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="about-values block-section" aria-labelledby="about-values-title">
        <h2 id="about-values-title" className="about-section-title">
          Наши принципы
        </h2>
        <p className="about-section-lead">
          Мы выстроили работу так, чтобы клиент чувствовал опору на каждом шаге — от первого звонка до
          завершения дела.
        </p>
        <ul className="about-values__grid">
          {VALUES.map((item) => (
            <li key={item.title} className="about-values__card">
              <h3 className="about-values__card-title">{item.title}</h3>
              <p className="about-values__card-text">{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="about-mission block-section" aria-labelledby="about-mission-title">
        <h2 id="about-mission-title" className="about-section-title">
          Миссия
        </h2>
        <p className="about-mission__text">
          Мы стремимся сделать профессиональную юридическую помощь доступной и понятной: без излишнего жаргона,
          с ясными этапами и возможностью отслеживать статус заявки в личном кабинете. Считаем, что качественная
          защита прав нужна не только крупным компаниям, но и каждому человеку, семье и малому бизнесу.
        </p>
        <p className="about-mission__text">
          Для нас важно не просто «выдать заключение», а помочь принять взвешенное решение: когда имеет смысл
          идти в суд, когда выгоднее договориться, какие документы подготовить заранее и как снизить риски в
          будущем.
        </p>
        <p className="about-mission__text">
          Если у вас возник вопрос — начните с{' '}
          <Link href="/contacts" className="about-inline-link">
            формы на странице контактов
          </Link>
          , ознакомьтесь с{' '}
          <Link href="/news" className="about-inline-link">
            новостями и разборами
          </Link>{' '}
          в блоге или посмотрите{' '}
          <Link href="/reviews" className="about-inline-link">
            отзывы клиентов
          </Link>
          .
        </p>
      </section>

      <div className="about-staff-wrap">
        <StaffSection />
      </div>

      <section className="about-cta block-section" aria-labelledby="about-cta-title">
        <div className="about-cta__panel">
          <h2 id="about-cta-title" className="about-cta__title">
            Готовы обсудить ваш вопрос?
          </h2>
          <p className="about-cta__text">
            Опишите ситуацию в заявке — мы свяжемся с вами, уточним детали и предложим удобный формат
            консультации: онлайн или в офисе. Первичный разбор поможет понять перспективы и следующие шаги.
          </p>
          <div className="about-cta__actions">
            <button type="button" className="about-btn about-btn--primary about-btn--lg" onClick={scrollToContacts}>
              Перейти к заявке
            </button>
            <Link href="/reviews" className="about-btn about-btn--outline about-btn--lg">
              Читать отзывы
            </Link>
          </div>
        </div>
      </section>

      <HomeFooter />
    </div>
  );
}
