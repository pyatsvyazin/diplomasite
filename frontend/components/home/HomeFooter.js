export default function HomeFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="home-footer">
      <div className="home-footer__inner">
        <p className="home-footer__text">© {year} Щит Справедливости. Все права защищены.</p>
        <p className="home-footer__text">Юридическая помощь для физических лиц и бизнеса.</p>
      </div>
    </footer>
  );
}
