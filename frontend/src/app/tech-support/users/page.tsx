import React from 'react';
import UserManagementClient from './client';

interface UserManagementPageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function UserManagementPage({ searchParams }: UserManagementPageProps) {
  const resolvedParams = await searchParams;
  const initialTab = resolvedParams?.tab === 'verification' ? 'verification' : 'directory';

  return (
    <UserManagementClient initialTab={initialTab} />
  );
}
