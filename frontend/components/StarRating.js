export default function StarRating({ value, max = 5, size = '1.2rem', readonly = true }) {
  const v = Math.min(max, Math.max(0, Number(value) || 0));
  const starSize = size;

  return (
    <span
      className="star-rating"
      style={{ fontSize: starSize }}
      aria-label={`Оценка: ${v} из ${max}`}
      role={readonly ? 'img' : undefined}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.min(1, Math.max(0, v - i + 1));
        return (
          <span
            key={i}
            className="star-rating__star"
            style={{ width: starSize, height: starSize }}
          >
            <span className="star-rating__star-bg" aria-hidden>★</span>
            <span
              className="star-rating__star-fill"
              style={
                fill >= 1
                  ? { width: '100%' }
                  : fill > 0
                    ? { width: '100%', clipPath: 'inset(0 57% 0 0)' }
                    : { width: '0', overflow: 'hidden' }
              }
              aria-hidden
            >
              ★
            </span>
          </span>
        );
      })}
    </span>
  );
}