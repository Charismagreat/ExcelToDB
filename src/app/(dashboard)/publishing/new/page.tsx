import { redirect } from 'next/navigation';

export default function NewPublishingPage() {
  // 이제 프로젝트 생성은 Publishing Hub 메인에서 이루어지므로 리다이렉트합니다.
  redirect('/publishing');
}
