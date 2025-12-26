import { Metadata } from 'next';
import { getStoreMetaAdmin } from '@/lib/db-admin';
import AdminSportsClient from './AdminSportsClient';
import { redirect } from 'next/navigation';

type PageProps = {
  params: { storeId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const store = await getStoreMetaAdmin(params.storeId);
  return {
    title: `Admin: ${store?.name || 'Sports Dashboard'}`,
    description: store?.description || 'Sports admin dashboard',
    manifest: `/api/manifest?storeId=${params.storeId}&context=admin`,
  };
}

export default async function AdminSportsPage({ params }: PageProps) {
  const store = await getStoreMetaAdmin(params.storeId);
  // If store exists but is not sports, redirect to general admin page
  if (store && store.storeType !== 'sports') {
    redirect(`/admin/${encodeURIComponent(params.storeId)}`);
  }

  // Pass store meta to the client for display and any client-side checks
  return <AdminSportsClient storeMeta={store || { id: params.storeId }} />;
}
