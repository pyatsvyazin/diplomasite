const SIZES = { sm: 32, md: 40, lg: 48 };

const PLACEHOLDER_AVATAR = '/images/avatars/placeholder_avatar.png';

export default function Avatar({ name, size = 'md', className = '', title, src, shape = 'circle' }) {
  const px = typeof size === 'number' ? size : (SIZES[size] ?? SIZES.md);
  const isSquare = shape === 'square';
  const imageSrc = src || PLACEHOLDER_AVATAR;

  const style = {
    width: px,
    height: px,
    borderRadius: isSquare ? 6 : '50%',
  };

  return (
    <span
      className={`avatar avatar--photo ${isSquare ? 'avatar--square' : ''} ${className}`.trim()}
      style={style}
      title={title}
      aria-hidden
    >
      <img
        src={imageSrc}
        alt=""
        width={px}
        height={px}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 'inherit' }}
      />
    </span>
  );
}