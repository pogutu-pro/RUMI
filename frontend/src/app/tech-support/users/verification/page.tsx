import UsersPage from '../page';

export default function UserVerificationPage({ searchParams }: { searchParams: Promise<any> }) {
  return <UsersPage defaultTab="verification" searchParams={searchParams} />;
}
