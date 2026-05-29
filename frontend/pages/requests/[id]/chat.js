import { useRouter } from 'next/router';
import RequestChatThread from '../../../components/chat/RequestChatThread';

export default function RequestChatPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!router.isReady) {
    return (
      <div className="page request-chat">
        <p>Загрузка...</p>
      </div>
    );
  }

  return <RequestChatThread requestId={id} embedded={false} />;
}
