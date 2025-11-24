import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  EyeIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const Blog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 9;

  const categories = [
    { id: 'all', label: 'All Posts' },
    { id: 'company_news', label: 'Company News' },
    { id: 'product_updates', label: 'Product Updates' },
    { id: 'student_stories', label: 'Student Stories' },
    { id: 'landlord_tips', label: 'Landlord Tips' },
    { id: 'housing_guides', label: 'Housing Guides' },
    { id: 'marketplace_highlights', label: 'Marketplace Highlights' }
  ];

  const blogPosts = [
    {
      id: 1,
      title: '5 Tips for Finding Student Accommodation in Nairobi',
      slug: '5-tips-student-accommodation-nairobi',
      excerpt: 'Finding the perfect hostel can be challenging. Here are our top tips for students looking for accommodation in Nairobi.',
      content: 'Full content here...',
      featured_image: '/api/placeholder/600/400',
      author: {
        name: 'Jane Smith',
        profile_picture: '/api/placeholder/100/100',
        bio: 'Content Manager at RUMI'
      },
      category: 'housing_guides',
      tags: ['accommodation', 'nairobi', 'tips', 'students'],
      read_time_minutes: 5,
      published_at: '2025-10-25T10:00:00Z',
      view_count: 450,
      is_featured: true
    },
    {
      id: 2,
      title: 'RUMI Expands to 5 Universities Across Kenya',
      slug: 'rumi-expands-5-universities-kenya',
      excerpt: 'We\'re excited to announce our expansion to five major universities, bringing quality student housing to more students.',
      content: 'Full content here...',
      featured_image: '/api/placeholder/600/400',
      author: {
        name: 'Joseph Ogutu',
        profile_picture: '/api/placeholder/100/100',
        bio: 'CTO at RUMI'
      },
      category: 'company_news',
      tags: ['expansion', 'universities', 'growth', 'kenya'],
      read_time_minutes: 3,
      published_at: '2025-10-20T14:30:00Z',
      view_count: 320,
      is_featured: true
    },
    {
      id: 3,
      title: 'Understanding Hostel Deposits in Kenya',
      slug: 'understanding-hostel-deposits-kenya',
      excerpt: 'Learn about security deposits, refund policies, and what to expect when booking accommodation in Kenya.',
      content: 'Full content here...',
      featured_image: '/api/placeholder/600/400',
      author: {
        name: 'David Kiprop',
        profile_picture: '/api/placeholder/100/100',
        bio: 'Customer Success Manager'
      },
      category: 'housing_guides',
      tags: ['deposits', 'security', 'refunds', 'policies'],
      read_time_minutes: 7,
      published_at: '2025-10-15T09:15:00Z',
      view_count: 285,
      is_featured: false
    },
    {
      id: 4,
      title: 'Student Marketplace Success Stories',
      slug: 'student-marketplace-success-stories',
      excerpt: 'Real stories from students who found great deals or successfully sold items through our marketplace.',
      content: 'Full content here...',
      featured_image: '/api/placeholder/600/400',
      author: {
        name: 'Grace Achieng',
        profile_picture: '/api/placeholder/100/100',
        bio: 'Community Manager'
      },
      category: 'marketplace_highlights',
      tags: ['marketplace', 'success', 'stories', 'deals'],
      read_time_minutes: 6,
      published_at: '2025-10-10T16:45:00Z',
      view_count: 198,
      is_featured: false
    },
    {
      id: 5,
      title: 'Tips for Landlords: Maximizing Your Hostel Occupancy',
      slug: 'tips-landlords-maximizing-hostel-occupancy',
      excerpt: 'Practical advice for hostel owners on how to attract more students and maintain high occupancy rates.',
      content: 'Full content here...',
      featured_image: '/api/placeholder/600/400',
      author: {
        name: 'Jane Smith',
        profile_picture: '/api/placeholder/100/100',
        bio: 'Content Manager at RUMI'
      },
      category: 'landlord_tips',
      tags: ['landlords', 'occupancy', 'tips', 'management'],
      read_time_minutes: 8,
      published_at: '2025-10-05T11:20:00Z',
      view_count: 167,
      is_featured: false
    },
    {
      id: 6,
      title: 'New Features: Enhanced Student Verification Process',
      slug: 'new-features-enhanced-student-verification',
      excerpt: 'We\'ve improved our verification system to make bookings even more secure and trustworthy for everyone.',
      content: 'Full content here...',
      featured_image: '/api/placeholder/600/400',
      author: {
        name: 'Joseph Ogutu',
        profile_picture: '/api/placeholder/100/100',
        bio: 'CTO at RUMI'
      },
      category: 'product_updates',
      tags: ['features', 'verification', 'security', 'updates'],
      read_time_minutes: 4,
      published_at: '2025-09-30T13:00:00Z',
      view_count: 234,
      is_featured: true
    }
  ];

  const featuredPosts = blogPosts.filter(post => post.is_featured);

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = searchTerm === '' ||
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = selectedTag === '' || post.tags.includes(selectedTag);

    return matchesCategory && matchesSearch && matchesTag;
  });

  // Get all unique tags
  const allTags = Array.from(new Set(blogPosts.flatMap(post => post.tags)));

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.label || categoryId;
  };

  const BlogPostCard = ({ post, isFeatured = false }: { post: typeof blogPosts[0], isFeatured?: boolean }) => (
    <article className={`bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${isFeatured ? 'border-2 border-blue-100' : ''}`}>
      {/* Featured Image */}
      <div className="relative overflow-hidden">
        <img
          src={post.featured_image}
          alt={post.title}
          className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
        />
        {isFeatured && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
            <StarIcon className="w-4 h-4 mr-1" />
            Featured
          </div>
        )}
        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm flex items-center">
          <EyeIcon className="w-4 h-4 mr-1" />
          {post.view_count}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center mb-3">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            {getCategoryLabel(post.category)}
          </span>
        </div>

        <h2 className={`font-bold text-gray-900 mb-3 line-clamp-2 ${isFeatured ? 'text-xl' : 'text-lg'}`}>
          <Link to={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
            {post.title}
          </Link>
        </h2>

        <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs hover:bg-blue-100 hover:text-blue-600 cursor-pointer transition-colors"
              onClick={() => setSelectedTag(tag)}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Meta Information */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <UserIcon className="w-4 h-4 mr-1" />
            <span>{post.author.name}</span>
          </div>
          <div className="flex items-center">
            <CalendarDaysIcon className="w-4 h-4 mr-1" />
            <span>{formatDate(post.published_at)}</span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="w-4 h-4 mr-1" />
            <span>{post.read_time_minutes} min read</span>
          </div>
        </div>
      </div>
    </article>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-700 text-white overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-secondary-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              RUMI Blog
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Insights, tips, and stories from the world of student accommodation and community building in Kenya.
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="lg:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            <div className="lg:w-48">
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts.map(post => (
                <BlogPostCard key={post.id} post={post} isFeatured={true} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory === 'all' ? 'All Articles' : getCategoryLabel(selectedCategory)}
            </h2>
            <span className="text-gray-600">
              {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {paginatedPosts.length === 0 ? (
            <div className="text-center py-12">
              <TagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {paginatedPosts.map(post => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg border ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-24 bg-gradient-to-r from-primary-900 via-primary-800 to-secondary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Stay Updated
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Subscribe to our newsletter for the latest articles, tips, and updates from the RUMI community.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href="#newsletter-signup"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-white rounded-xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Subscribe to Newsletter
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;