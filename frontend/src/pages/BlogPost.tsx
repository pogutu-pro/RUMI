import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  ArrowLeftIcon,
  ShareIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

// Mock data - in a real app, this would come from an API
const blogPosts = [
  {
    id: 1,
    title: '5 Tips for Finding Student Accommodation in Nairobi',
    slug: '5-tips-student-accommodation-nairobi',
    excerpt: 'Finding the perfect hostel can be challenging. Here are our top tips for students looking for accommodation in Nairobi.',
    content: `
      <h2>1. Start Your Search Early</h2>
      <p>The student accommodation market in Nairobi is competitive, especially near popular universities like the University of Nairobi, Kenyatta University, and Strathmore University. The best properties get booked quickly, so start your search 2-3 months before your intended move-in date.</p>

      <h2>2. Research University Proximity</h2>
      <p>Location is crucial for student accommodation. Look for hostels within a 30-45 minute commute from your university. Consider transportation costs, safety of routes, and availability of public transport options like matatus or buses.</p>

      <h2>3. Verify Property Quality</h2>
      <p>Don't just look at photos online. Visit properties in person or request recent photos. Check for:</p>
      <ul>
        <li>Clean and well-maintained facilities</li>
        <li>Working utilities (water, electricity, WiFi)</li>
        <li>Security measures (gates, guards, CCTV)</li>
        <li>Common areas and amenities</li>
      </ul>

      <h2>4. Compare Prices and Included Amenities</h2>
      <p>Hostel prices in Nairobi typically range from KSh 5,000 to KSh 15,000 per month, depending on location, amenities, and room type. Consider what amenities are included in the price versus what you'll need to pay extra for.</p>

      <h2>5. Read Reviews and Ask Questions</h2>
      <p>Check reviews from current and former residents. Ask about:</p>
      <ul>
        <li>Management responsiveness</li>
        <li>Noise levels and quiet hours</li>
        <li>Maintenance and repair response times</li>
        <li>Community atmosphere</li>
      </ul>

      <h2>Final Thoughts</h2>
      <p>Finding the right student accommodation in Nairobi takes time and research, but it's worth the effort to ensure you have a safe, comfortable place to live while focusing on your studies. Remember to trust your instincts and never rush into a decision you're not comfortable with.</p>
    `,
    featured_image: '/api/placeholder/800/400',
    author: {
      name: 'Jane Smith',
      profile_picture: '/api/placeholder/100/100',
      bio: 'Content Manager at RUMI with 3+ years experience in student housing and community management.'
    },
    category: 'housing_guides',
    tags: ['accommodation', 'nairobi', 'tips', 'students', 'university'],
    read_time_minutes: 5,
    published_at: '2025-10-25T10:00:00Z',
    view_count: 450,
    is_featured: true,
    related_posts: [
      {
        id: 3,
        title: 'Understanding Hostel Deposits in Kenya',
        slug: 'understanding-hostel-deposits-kenya',
        excerpt: 'Learn about security deposits and refund policies...',
        featured_image: '/api/placeholder/300/200'
      },
      {
        id: 5,
        title: 'Tips for Landlords: Maximizing Your Hostel Occupancy',
        slug: 'tips-landlords-maximizing-hostel-occupancy',
        excerpt: 'Practical advice for hostel owners...',
        featured_image: '/api/placeholder/300/200'
      }
    ]
  },
  // Add more blog posts here...
];

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [helpfulCount, setHelpfulCount] = React.useState(245);
  const [notHelpfulCount, setNotHelpfulCount] = React.useState(5);
  const [userFeedback, setUserFeedback] = React.useState<'helpful' | 'not-helpful' | null>(null);

  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-6">The article you're looking for doesn't exist.</p>
          <Link to="/blog" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleFeedback = (feedback: 'helpful' | 'not-helpful') => {
    if (userFeedback === feedback) return; // Already voted

    if (userFeedback) {
      // Remove previous vote
      if (userFeedback === 'helpful') {
        setHelpfulCount(prev => prev - 1);
      } else {
        setNotHelpfulCount(prev => prev - 1);
      }
    }

    // Add new vote
    if (feedback === 'helpful') {
      setHelpfulCount(prev => prev + 1);
    } else {
      setNotHelpfulCount(prev => prev + 1);
    }

    setUserFeedback(feedback);
  };

  const shareUrl = window.location.href;
  const shareText = `Check out this article: ${post.title}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/blog" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center mb-4">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Housing Guides
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          <p className="text-xl text-gray-600 mb-6 leading-relaxed">
            {post.excerpt}
          </p>

          {/* Article Meta */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-b border-gray-200 pb-6">
            <div className="flex items-center">
              <UserIcon className="w-4 h-4 mr-2" />
              <span>{post.author.name}</span>
            </div>
            <div className="flex items-center">
              <CalendarDaysIcon className="w-4 h-4 mr-2" />
              <span>{formatDate(post.published_at)}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-2" />
              <span>{post.read_time_minutes} min read</span>
            </div>
            <div className="flex items-center">
              <EyeIcon className="w-4 h-4 mr-2" />
              <span>{post.view_count} views</span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="mb-8">
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-64 md:h-96 object-cover rounded-2xl shadow-lg"
          />
        </div>

        {/* Article Content */}
        <div
          className="prose prose-lg max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          <TagIcon className="w-5 h-5 text-gray-400 mr-2" />
          {post.tags.map((tag, index) => (
            <Link
              key={index}
              to={`/blog?tag=${tag}`}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>

        {/* Share Section */}
        <div className="bg-gray-100 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">Share this article</span>
            <div className="flex gap-3">
              <button
                onClick={() => navigator.share?.({ title: post.title, text: shareText, url: shareUrl })}
                className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Share"
              >
                <ShareIcon className="w-5 h-5" />
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                title="Share on Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Was this article helpful?</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleFeedback('helpful')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                userFeedback === 'helpful'
                  ? 'bg-green-100 border-green-300 text-green-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <HandThumbUpIcon className="w-5 h-5" />
              <span>Helpful ({helpfulCount})</span>
            </button>
            <button
              onClick={() => handleFeedback('not-helpful')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                userFeedback === 'not-helpful'
                  ? 'bg-red-100 border-red-300 text-red-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <HandThumbDownIcon className="w-5 h-5" />
              <span>Not helpful ({notHelpfulCount})</span>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Your feedback helps us improve our content. Thank you!
          </p>
        </div>

        {/* Author Bio */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-start gap-4">
            <img
              src={post.author.profile_picture}
              alt={post.author.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">{post.author.name}</h4>
              <p className="text-gray-600 text-sm mb-3">{post.author.bio}</p>
              <div className="text-sm text-gray-500">
                Published on {formatDate(post.published_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {post.related_posts && post.related_posts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {post.related_posts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.slug}`}
                  className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <img
                    src={relatedPost.featured_image}
                    alt={relatedPost.title}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h4>
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                      {relatedPost.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};

export default BlogPost;