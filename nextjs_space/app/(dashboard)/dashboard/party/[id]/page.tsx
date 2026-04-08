import { redirect } from 'next/navigation';

// Trang này đã được thay thế bởi /dashboard/party/members/[id]/
// ID cũ là userId, không map trực tiếp sang memberId — redirect về danh sách.
export default function PartyMemberDetailLegacyPage() {
  redirect('/dashboard/party/members');
}
