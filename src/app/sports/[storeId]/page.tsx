import { Metadata } from 'next';
import { getStoreMetaAdminCached } from '@/lib/db-admin';
import SportsStorefrontClient from './SportsStorefrontClient';

type PageProps = {
  params: { storeId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const store = await getStoreMetaAdminCached(params.storeId);
  return {
    title: store?.name || 'PitchPerfect',
    description: store?.description || 'Book pitches and courts',
    manifest: `/api/manifest?storeId=${params.storeId}&context=customer`,
  };
}

export default async function SportsPage({ params }: PageProps) {
  const storeMeta = await getStoreMetaAdminCached(params.storeId);

  return (
    <SportsStorefrontClient
      storeId={params.storeId}
      initialStoreMeta={storeMeta}
    />
  );
}
