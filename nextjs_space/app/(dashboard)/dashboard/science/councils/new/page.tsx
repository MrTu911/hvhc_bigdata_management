import { redirect } from 'next/navigation';

/**
 * Redirect sang wizard đầy đủ ở /activities/councils/new.
 * Giữ route này để không gây 404 nếu còn link cũ.
 */
export default function CouncilsNewRedirect({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const params = new URLSearchParams(searchParams as Record<string, string>);
  const qs = params.toString();
  redirect(`/dashboard/science/activities/councils/new${qs ? `?${qs}` : ''}`);
}
