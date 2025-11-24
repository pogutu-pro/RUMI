import React, { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  LightBulbIcon,
  UserGroupIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

const FAQ: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const categories = [
    { id: 'all', label: 'All Categories', icon: null },
    { id: 'getting_started', label: 'Getting Started', icon: LightBulbIcon },
    { id: 'students', label: 'For Students', icon: UserGroupIcon },
    { id: 'landlords', label: 'For Landlords', icon: null },
    { id: 'payments', label: 'Payments & Billing', icon: CreditCardIcon },
    { id: 'safety', label: 'Safety & Security', icon: ShieldCheckIcon },
    { id: 'technical', label: 'Technical Support', icon: WrenchScrewdriverIcon },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBagIcon }
  ];

  const faqs = [
    // Getting Started
    {
      id: 1,
      category: 'getting_started',
      question: 'How do I create an account?',
      answer: 'Click on the "Sign Up" button and choose your role (Student or Landlord). Fill in your basic information including your full name, email address, and phone number. Verify your email address through the confirmation link sent to your inbox, and you\'re ready to start!',
      helpful_count: 245,
      not_helpful_count: 5,
      tags: ['account', 'registration', 'signup']
    },
    {
      id: 2,
      category: 'getting_started',
      question: 'What\'s the difference between a student and landlord account?',
      answer: 'Student accounts allow you to browse and book hostels, access the marketplace for buying/selling items, and connect with other students. Landlord accounts enable you to list and manage your properties, respond to booking inquiries, and manage your listings.',
      helpful_count: 189,
      not_helpful_count: 3,
      tags: ['account', 'roles', 'student', 'landlord']
    },

    // For Students
    {
      id: 3,
      category: 'students',
      question: 'How do I search for available hostels?',
      answer: 'Use the search bar on the homepage or navigate to the "Hostels" page. You can filter by university, price range, amenities, and location. Each listing shows photos, prices, availability, and reviews from other students.',
      helpful_count: 312,
      not_helpful_count: 8,
      tags: ['search', 'hostels', 'filter', 'availability']
    },
    {
      id: 4,
      category: 'students',
      question: 'How do I book a room?',
      answer: 'Once you find a suitable room, click "Book Now" and select your preferred dates. Complete the payment through our secure M-Pesa integration. You\'ll receive a booking confirmation and check-in instructions via email and SMS.',
      helpful_count: 278,
      not_helpful_count: 12,
      tags: ['booking', 'payment', 'reservation', 'mpesa']
    },
    {
      id: 5,
      category: 'students',
      question: 'What payment methods do you accept?',
      answer: 'We currently accept M-Pesa payments for all bookings and marketplace transactions. This ensures fast, secure, and convenient payments for all users in Kenya. Paybill number: 123456',
      helpful_count: 156,
      not_helpful_count: 4,
      tags: ['payment', 'mpesa', 'methods', 'security']
    },
    {
      id: 6,
      category: 'students',
      question: 'Can I cancel or modify my booking?',
      answer: 'Yes, you can cancel or modify bookings up to 48 hours before check-in through your dashboard. Refund policies vary by hostel, but we guarantee fair processing of all cancellations.',
      helpful_count: 98,
      not_helpful_count: 7,
      tags: ['cancellation', 'refund', 'modify', 'policy']
    },

    // For Landlords
    {
      id: 7,
      category: 'landlords',
      question: 'How do I list my hostel?',
      answer: 'Create a landlord account, then click "List Your Hostel" from your dashboard. Provide detailed information about your property including photos, amenities, pricing, and house rules. Our team will verify your listing within 24-48 hours.',
      helpful_count: 134,
      not_helpful_count: 9,
      tags: ['listing', 'landlord', 'property', 'verification']
    },
    {
      id: 8,
      category: 'landlords',
      question: 'What fees do I pay for using RUMI?',
      answer: 'We charge a competitive commission on successful bookings (typically 5-10% depending on your plan). There are no setup fees or monthly charges. Premium features like enhanced listing visibility are available for a small monthly fee.',
      helpful_count: 87,
      not_helpful_count: 2,
      tags: ['fees', 'commission', 'pricing', 'landlord']
    },

    // Payments & Billing
    {
      id: 9,
      category: 'payments',
      question: 'When do I get paid for bookings?',
      answer: 'Payments are processed within 24 hours of successful check-in. Funds are transferred directly to your registered M-Pesa number or bank account. We hold payments securely until the guest confirms check-in.',
      helpful_count: 76,
      not_helpful_count: 3,
      tags: ['payout', 'payment', 'landlord', 'mpesa']
    },
    {
      id: 10,
      category: 'payments',
      question: 'Are payments secure?',
      answer: 'Absolutely! We use bank-level security with SSL encryption and work directly with trusted payment providers. Your payment information is never stored on our servers, and all transactions are monitored for fraud.',
      helpful_count: 145,
      not_helpful_count: 1,
      tags: ['security', 'encryption', 'fraud', 'trust']
    },

    // Safety & Security
    {
      id: 11,
      category: 'safety',
      question: 'How do you verify hostels and landlords?',
      answer: 'All hostels undergo a thorough verification process including background checks, property inspections, and reference verification. We also collect reviews and ratings from students to maintain quality standards.',
      helpful_count: 203,
      not_helpful_count: 6,
      tags: ['verification', 'safety', 'trust', 'quality']
    },
    {
      id: 12,
      category: 'safety',
      question: 'What should I do if I have a problem with my booking?',
      answer: 'Contact our support team immediately through the app, email, or phone. We have a 24-hour response guarantee and will work with both parties to resolve any issues fairly and quickly.',
      helpful_count: 67,
      not_helpful_count: 4,
      tags: ['support', 'problem', 'dispute', 'resolution']
    },

    // Technical Support
    {
      id: 13,
      category: 'technical',
      question: 'I forgot my password. How do I reset it?',
      answer: 'Click "Forgot Password" on the login page and enter your email address. You\'ll receive a secure reset link via email. For security, reset links expire after 24 hours.',
      helpful_count: 92,
      not_helpful_count: 2,
      tags: ['password', 'reset', 'login', 'security']
    },
    {
      id: 14,
      category: 'technical',
      question: 'The app is not working properly. What should I do?',
      answer: 'First, try refreshing the page or clearing your browser cache. If the issue persists, contact our technical support team with details about your device, browser, and the specific problem you\'re experiencing.',
      helpful_count: 45,
      not_helpful_count: 8,
      tags: ['app', 'technical', 'support', 'troubleshooting']
    },

    // Marketplace
    {
      id: 15,
      category: 'marketplace',
      question: 'How do I buy or sell items?',
      answer: 'Browse the marketplace, create a listing to sell items, or contact sellers directly to buy. All transactions are secured through our platform, and payments are processed via M-Pesa for your safety.',
      helpful_count: 178,
      not_helpful_count: 11,
      tags: ['marketplace', 'buy', 'sell', 'trading']
    },
    {
      id: 16,
      category: 'marketplace',
      question: 'Are marketplace transactions safe?',
      answer: 'Yes! We facilitate secure communication between buyers and sellers, and payments are held in escrow until both parties confirm the transaction is complete. We also provide dispute resolution if needed.',
      helpful_count: 123,
      not_helpful_count: 3,
      tags: ['marketplace', 'safety', 'escrow', 'dispute']
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchTerm === '' ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const toggleExpanded = (faqId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
    }
    setExpandedItems(newExpanded);
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.icon;
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.label || categoryId;
  };

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
              Frequently Asked Questions
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Find answers to common questions about using RUMI. Can't find what you're looking for? Contact our support team.
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="md:w-64">
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
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <LightBulbIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No FAQs found</h3>
              <p className="text-gray-600">Try adjusting your search terms or category filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((faq) => {
                const isExpanded = expandedItems.has(faq.id);
                const IconComponent = getCategoryIcon(faq.category);

                return (
                  <div key={faq.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => toggleExpanded(faq.id)}
                      className="w-full px-6 py-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          {IconComponent && (
                            <IconComponent className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 pr-4">
                              {faq.question}
                            </h3>
                            <div className="flex items-center mt-2 text-sm text-gray-500">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                {getCategoryLabel(faq.category)}
                              </span>
                              <span className="ml-4 flex items-center">
                                <span className="text-green-600 mr-1">👍 {faq.helpful_count}</span>
                                <span className="text-gray-400 mr-2">•</span>
                                <span className="text-red-600">👎 {faq.not_helpful_count}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          {isExpanded ? (
                            <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-4 border-t border-gray-100">
                        <div className="pt-4">
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                          {faq.tags.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {faq.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-24 bg-gradient-to-r from-primary-900 via-primary-800 to-secondary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Still Have Questions?
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-white rounded-xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Contact Support
            </a>
            <a
              href="mailto:support@rumi.co.ke"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Email Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;