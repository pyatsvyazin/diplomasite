import Link from 'next/link';

export default function CheckEmailPage() {
  return (
    <div className="authPage">
      <h1 className="authPage__title">Подтвердите почту</h1>
      <p className="authPage__text">
        На вашу почту отправлена ссылка для подтверждения. Перейдите по ней, затем войдите в аккаунт.
      </p>
      <Link href="/auth/login" className="authPage__link">Перейти к входу</Link>
    </div>
  );
}
