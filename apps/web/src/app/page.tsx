import { redirect } from 'next/navigation';

/** Home redirects to auth; marketing lives at the same route group when enabled separately */
export default function HomePage() {
  redirect('/auth/login');
}
