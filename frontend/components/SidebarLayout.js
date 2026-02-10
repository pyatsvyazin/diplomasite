import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const defaultIcon = <span className="sidebar-layout__icon-placeholder" aria-hidden />;

function NavItem({ item, pathname, collapsed }) {
  const router = useRouter();
  const icon = item.icon ?? defaultIcon;

  if (item.children) {
    const isOpen = item.children.some((c) => c.href && pathname.startsWith(c.href));
    return (
      <GroupItem
        label={item.label}
        icon={icon}
        childrenItems={item.children}
        pathname={pathname}
        collapsed={collapsed}
        isOpen={isOpen}
      />
    );
  }

  const isActive = item.href && pathname === item.href;
  const className = `sidebar-layout__nav-link ${isActive ? 'sidebar-layout__nav-link--active' : ''} ${collapsed ? 'sidebar-layout__nav-link--collapsed' : ''}`;

  return (
    <Link href={item.href} className={className} title={collapsed ? item.label : undefined}>
      <span className="sidebar-layout__nav-icon">{icon}</span>
      <span className="sidebar-layout__nav-label">{item.label}</span>
    </Link>
  );
}

function GroupItem({ label, icon, childrenItems, pathname, collapsed, isOpen }) {
  const [open, setOpen] = useState(isOpen);
  const router = useRouter();
  const expanded = collapsed ? false : open;

  if (collapsed) {
    return (
      <>
        {childrenItems.map((child) => {
          const icon = child.icon ?? defaultIcon;
          const isActive = child.href && pathname.startsWith(child.href);
          return (
            <Link
              key={child.href}
              href={child.href}
              className={`sidebar-layout__nav-link sidebar-layout__nav-link--sub sidebar-layout__nav-link--collapsed ${isActive ? 'sidebar-layout__nav-link--active' : ''}`}
              title={child.label}
            >
              <span className="sidebar-layout__nav-icon">{icon}</span>
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <div className="sidebar-layout__nav-group">
      <button
        type="button"
        className={`sidebar-layout__nav-link sidebar-layout__nav-link--trigger ${expanded ? 'sidebar-layout__nav-link--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sidebar-layout__nav-icon">{icon}</span>
        <span className="sidebar-layout__nav-label">{label}</span>
        <span className="sidebar-layout__nav-arrow" aria-hidden>▼</span>
      </button>
      {expanded && (
        <div className="sidebar-layout__nav-sublinks">
          {childrenItems.map((child) => {
            const icon = child.icon ?? defaultIcon;
            const isActive = child.href && pathname.startsWith(child.href);
            return (
              <Link
                key={child.href}
                href={child.href}
                className={`sidebar-layout__nav-sublink ${isActive ? 'sidebar-layout__nav-sublink--active' : ''}`}
              >
                <span className="sidebar-layout__nav-icon">{icon}</span>
                <span className="sidebar-layout__nav-label">{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SidebarLayout({
  sidebar,
  items,
  children,
  wrapperClassName = 'sidebar-layout',
  sidebarClassName = 'sidebar-layout__sidebar',
  contentClassName = 'sidebar-layout__content',
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem('sidebarCollapsed', next ? 'true' : '');
      } catch (_) {}
      return next;
    });
  };

  const useItems = items != null && items.length > 0;
  const sidebarContent = useItems ? (
    <>
      <button
        type="button"
        className="sidebar-layout__toggle"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
      >
        <span className="sidebar-layout__toggle-icon" aria-hidden>
          <img
            key={collapsed ? 'open' : 'close'}
            src={collapsed ? '/images/icon/sidebar_open.svg' : '/images/icon/sidebar_close.svg'}
            alt=""
            width={24}
            height={24}
          />
        </span>
      </button>
      <nav className="sidebar-layout__nav">
        {items.map((item, idx) => (
          <NavItem key={item.href || item.label || idx} item={item} pathname={router.pathname} collapsed={collapsed} />
        ))}
      </nav>
    </>
  ) : (
    sidebar
  );

  return (
    <div className={`${wrapperClassName} ${useItems && collapsed ? 'sidebar-layout--collapsed' : ''}`.trim()}>
      <aside className={`${sidebarClassName} ${useItems && collapsed ? 'sidebar-layout__sidebar--collapsed' : ''}`.trim()}>
        {sidebarContent}
      </aside>
      <main className={contentClassName}>
        {children}
      </main>
    </div>
  );
}