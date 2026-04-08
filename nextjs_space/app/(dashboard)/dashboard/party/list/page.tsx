import { redirect } from 'next/navigation';

// Trang này đã được thay thế bởi /dashboard/party/members/
// Giữ lại route để không phá bookmark cũ.
export default function PartyMembersListLegacyPage() {
  redirect('/dashboard/party/members');
}
