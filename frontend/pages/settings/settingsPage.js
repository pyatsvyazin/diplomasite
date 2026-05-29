import { useEffect } from 'react';
import { useRouter } from 'next/router';

/** Настройки перенесены в профиль → вкладка «Настройки». */
export default function SettingsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/profile/profilePage?tab=settings');
  }, [router]);
  return (
    <div className="page">
      <p>Переход в настройки профиля…</p>
    </div>
  );
}
