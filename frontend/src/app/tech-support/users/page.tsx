import React from 'react';
import UserManagementClient from './client';

interface UserManagementPageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
  defaultTab?: 'directory' | 'verification';
}

export default async function UserManagementPage({ searchParams, defaultTab }: UserManagementPageProps) {
  const resolvedParams = await searchParams;
  const initialTab = defaultTab || (resolvedParams?.tab === 'verification' ? 'verification' : 'directory');

  return (
    <UserManagementClient initialTab={initialTab} />
  );
}
