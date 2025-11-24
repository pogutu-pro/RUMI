import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ShareIcon,
  HeartIcon,
  MapPinIcon,
  ClockIcon,
  TagIcon,
  CheckCircleIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../hooks/useCart';
import WishlistButton from '../../components/marketplace/WishlistButton';
import ProductReviews from '../../components/marketplace/ProductReviews';

interface Product {
  product_id: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  seller: {
    user_id: number;
    business_name: string;
    rating: number | null;
    is_verified: boolean;
    total_sales: number;
    phone?: string;
    email?: string;
  };
  images: Array<{
    url: string;
    is_primary: boolean;
  }>;
  location: string | null;
  posted_at: string;
  view_count: number;
  is_negotiable: boolean;
  is_available: boolean;
  tags?: string[];
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      // Simulated data - replace with actual API call
      const mockProduct: Product = {
        product_id: parseInt(id || '1'),
        title: 'MacBook Pro 13" 2020 - Like New',
        description: `Selling my MacBook Pro in excellent condition. Barely used, kept in a case since purchase. 
        
Specifications:
- Intel Core i5 processor
- 8GB RAM
- 256GB SSD
- Retina Display
- Touch Bar

Includes:
- Original box
- Charger and cable
- Protective case
- Screen protector (already applied)

Reason for selling: Upgraded to newer model. Perfect for students who need a reliable laptop for studies, coding, or design work. Battery health at 95%.

Open to reasonable offers. Serious buyers only.`,
        price: 75000,
        condition: 'like_new',
        category: 'electronics',
        seller: {
          user_id: 123,
          business_name: 'TechStudent KE',
          rating: 4.8,
          is_verified: true,
          total_sales: 23,
          phone: '+254 712 345 678',
          email: 'techstudent@example.com'
        },
        images: [
          { url: '/api/placeholder/800/600', is_primary: true },
          { url: '/api/placeholder/800/600', is_primary: false },
          { url: '/api/placeholder/800/600', is_primary: false },
          { url: '/api/placeholder/800/600', is_primary: false }
        ],
        location: 'Nairobi, Karen',
        posted_at: '2025-11-15T10:00:00Z',
        view_count: 234,
        is_negotiable: true,
        is_available: true,
        tags: ['laptop', 'macbook', 'apple', 'electronics', 'student']
      };
      
      setProduct(mockProduct);
      setError(null);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSeller = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowContactForm(true);
  };

  const handleMakeOffer = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Handle make offer logic
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!product) return;

    try {
      setIsAddingToCart(true);
      await addToCart(product.product_id, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'like_new': return 'bg-blue-100 text-blue-800';
      case 'good': return 'bg-yellow-100 text-yellow-800';
      case 'fair': return 'bg-orange-100 text-orange-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionLabel = (condition: string) => {
    return condition.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The product you\'re looking for doesn\'t exist.'}</p>
          <Link to="/marketplace" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/marketplace" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4">
                <div className="mb-4">
                  <img
                    src={product.images[selectedImage]?.url}
                    alt={product.title}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={`${product.title} ${index + 1}`}
                      className={`h-20 object-cover rounded-lg cursor-pointer ${
                        selectedImage === index ? 'ring-2 ring-blue-600' : ''
                      }`}
                      onClick={() => setSelectedImage(index)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(product.condition)}`}>
                      {getConditionLabel(product.condition)}
                    </span>
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                      {getCategoryLabel(product.category)}
                    </span>
                    {product.is_negotiable && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        Negotiable
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <WishlistButton productId={parseInt(id || '1')} />
                  <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                    <ShareIcon className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-4xl font-bold text-blue-600">
                  KSh {product.price.toLocaleString()}
                </p>
                {product.is_negotiable && (
                  <p className="text-sm text-gray-600 mt-1">Price is negotiable</p>
                )}
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-600 mb-6 pb-6 border-b">
                <div className="flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  <span>{product.location}</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span>Posted {formatDate(product.posted_at)}</span>
                </div>
                <div className="flex items-center">
                  <EyeIcon className="w-4 h-4 mr-1" />
                  <span>{product.view_count} views</span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>

              {product.tags && product.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex flex-wrap gap-2">
                    <TagIcon className="w-5 h-5 text-gray-400 mr-1" />
                    {product.tags.map((tag, index) => (
                      <Link
                        key={index}
                        to={`/marketplace?tag=${tag}`}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product Reviews */}
            <ProductReviews productId={id || '1'} />

            {/* Safety Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-2">Safety Tips</h3>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Meet in a safe, public location</li>
                    <li>• Inspect the item before payment</li>
                    <li>• Never send money before seeing the item</li>
                    <li>• Report suspicious listings</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Availability Status */}
              {!product.is_available && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-red-800 font-semibold text-center">This item is no longer available</p>
                </div>
              )}

              {/* Add to Cart Card */}
              {product.is_available && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Add to Cart</h3>

                  {/* Quantity Selector */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                        className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-medium text-lg">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= 99}
                        className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || addedToCart}
                    className={`w-full px-4 py-3 rounded-lg font-semibold flex items-center justify-center transition-colors ${
                      addedToCart
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {addedToCart ? (
                      <>
                        <CheckIcon className="w-5 h-5 mr-2" />
                        Added to Cart!
                      </>
                    ) : isAddingToCart ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingCartIcon className="w-5 h-5 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </button>

                  {/* Subtotal */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Subtotal ({quantity} item{quantity > 1 ? 's' : ''})</span>
                      <span className="font-semibold text-gray-900">
                        KES {(product.price * quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Seller Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Seller</h3>

                {/* Seller Info */}
                <div className="mb-4 pb-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{product.seller.business_name}</span>
                    {product.seller.is_verified && (
                      <ShieldCheckIcon className="w-5 h-5 text-blue-600" title="Verified Seller" />
                    )}
                  </div>
                  {product.seller.rating && (
                    <div className="flex items-center mb-2">
                      <div className="flex items-center mr-2">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.seller.rating!)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {product.seller.rating} ({product.seller.total_sales} sales)
                      </span>
                    </div>
                  )}
                </div>

                {/* Contact Buttons */}
                <div className="space-y-3">
                  {product.is_available ? (
                    <>
                      <button
                        onClick={handleContactSeller}
                        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center"
                      >
                        <PhoneIcon className="w-5 h-5 mr-2" />
                        Contact Seller
                      </button>
                      {product.is_negotiable && (
                        <button
                          onClick={handleMakeOffer}
                          className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center"
                        >
                          <TagIcon className="w-5 h-5 mr-2" />
                          Make an Offer
                        </button>
                      )}
                      <button
                        onClick={handleContactSeller}
                        className="w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 font-semibold flex items-center justify-center"
                      >
                        <EnvelopeIcon className="w-5 h-5 mr-2" />
                        Send Message
                      </button>
                    </>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 px-4 py-3 rounded-lg cursor-not-allowed font-semibold"
                    >
                      Item Sold
                    </button>
                  )}
                </div>
              </div>

              {/* Report Listing */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <button className="w-full text-red-600 hover:text-red-800 text-sm font-medium flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                  Report this listing
                </button>
              </div>

              {/* Similar Items */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Similar Items</h3>
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <Link
                      key={item}
                      to={`/marketplace/product/${item}`}
                      className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src="/api/placeholder/60/60"
                        alt="Similar product"
                        className="w-16 h-16 object-cover rounded-lg mr-3"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                          Similar Product Title
                        </h4>
                        <p className="text-blue-600 font-semibold text-sm">KSh 50,000</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;