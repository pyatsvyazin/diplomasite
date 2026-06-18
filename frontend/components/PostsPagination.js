export default function PostsPagination({ page, lastPage, onPageChange, className = '' }) {
  if (!lastPage || lastPage <= 1) return null;

  const pages = [];
  for (let p = 1; p <= lastPage; p += 1) {
    if (p === 1 || p === lastPage || (p >= page - 2 && p <= page + 2)) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  const rootClass = ['posts-pagination', className].filter(Boolean).join(' ');

  return (
    <nav className={rootClass} aria-label="Страницы">
      <button
        type="button"
        className="posts-pagination__btn"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Назад
      </button>
      <div className="posts-pagination__pages">
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="posts-pagination__ellipsis">…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`posts-pagination__page${p === page ? ' posts-pagination__page--active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
      </div>
      <button
        type="button"
        className="posts-pagination__btn"
        disabled={page >= lastPage}
        onClick={() => onPageChange(page + 1)}
      >
        Вперёд
      </button>
    </nav>
  );
}
