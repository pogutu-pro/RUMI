import React, { useState, useEffect } from 'react';
import ProductCard from '../components/marketplace/ProductCard';
import { marketplaceAPI } from '../services/api';

interface Product {
  product_id: number;
  title: string;
  price: number;
  condition: string;
  category: string;
  seller: {
    business_name: string;
    rating: number | null;
    is_verified: boolean;
  };
  images: Array<{
    url: string;
    is_primary: boolean;
  }>;
  location: string | null;
  posted_at: string;
  view_count: number;
  is_negotiable: boolean;
}

const Marketplace: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState('all');

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'textbooks', label: 'Textbooks' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'sports', label: 'Sports' },
    { value: 'stationery', label: 'Stationery' },
    { value: 'other', label: 'Other' }
  ];

  const conditions = [
    { value: 'all', label: 'All Conditions' },
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await marketplaceAPI.getProducts();
      setProducts(response.data.products || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.seller.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesCondition = condition === 'all' || product.condition === condition;
    const matchesMinPrice = !minPrice || product.price >= parseInt(minPrice);
    const matchesMaxPrice = !maxPrice || product.price <= parseInt(maxPrice);

    return matchesSearch && matchesCategory && matchesCondition && matchesMinPrice && matchesMaxPrice;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-secondary-700 via-secondary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Student Marketplace</h1>
          <p className="text-xl text-gray-200">Buy and sell items within your university community</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search products by title or seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {conditions.map(cond => (
                <option key={cond.value} value={cond.value}>
                  {cond.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

        {/* Results Count */}
        {!loading && !error && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
            </p>
            <div className="flex items-center space-x-4">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                List Item
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredProducts.length === 0 && products.length > 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products match your criteria</h3>
            <p className="text-gray-600">Try adjusting your search filters</p>
          </div>
        )}

        {/* No Products State */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products available</h3>
            <p className="text-gray-600 mb-4">Be the first to list an item!</p>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
              List Your First Item
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;