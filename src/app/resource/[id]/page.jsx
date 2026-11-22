import { items } from '@/data/openItems';
import { ResourceClient } from './ResourceClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const normalizedId = id ? id.trim().replace(/\s+/g, '-') : '';
  const b = items.find((x) => x.id === id || x.id === normalizedId);

  if (!b) {
    return {
      title: 'Resource Not Found — EduVault',
      description: 'The requested resource was not found in EduVault.',
    };
  }

  return {
    title: `${b.title} | Free Textbook & Study Material — EduVault`,
    description: b.description || `Read and download ${b.title} for free on EduVault.`,
    openGraph: {
      title: `${b.title} — ${b.author || 'EduVault'}`,
      description: b.description || `Read and download ${b.title} for free on EduVault.`,
      images: b.coverUrl ? [{ url: b.coverUrl }] : [],
    },
  };
}

export default function Page() {
  return <ResourceClient />;
}
