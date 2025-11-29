import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPopularProducts } from '../lib/db';
import { Product } from '../types/product';

export default function PopularProducts({ storeId }: { storeId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Fetch 6 popular products by default
        const popularProducts = await getPopularProducts(storeId, 6);
        setProducts(popularProducts);
      } catch (error) {
        console.error('Error fetching popular products:', error);
      } finally {
        setLoading(false);
      }
    }
    if (storeId) fetchProducts();
  }, [storeId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-card-hover h-64 rounded-lg transition-colors"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.id}`}
          className="group bg-card-background rounded-lg shadow-[var(--shadow-md)] 
            hover:shadow-[var(--shadow-lg)] p-4 transition-all duration-300 
            hover:-translate-y-1 relative overflow-hidden"
        >
          <div className="aspect-square relative mb-3 overflow-hidden rounded-lg bg-card-hover">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="h-full w-full bg-card-hover flex items-center justify-center text-text-secondary">
                <span>No Image</span>
              </div>
            )}
          </div>

          <h3 className="text-text-primary font-semibold truncate">
            {product.name}
          </h3>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-text-primary font-medium">
              {new Intl.NumberFormat('en-NG', {
                style: 'currency',
                currency: 'NGN'
              }).format(product.price)}
            </p>
            <div className="text-xs px-2 py-1 rounded-full bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]">
              Popular
            </div>
          </div>

          {product.productType === 'general' && product.limitedStock && (
            <div className="absolute top-2 left-2 z-10 inline-flex items-center px-2.5 py-0.5 
    rounded-full text-xs font-medium bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] 
    shadow-sm animate-fade-in">
              Limited Stock
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}