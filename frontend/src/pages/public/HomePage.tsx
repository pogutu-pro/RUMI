import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, TrendingUp, Shield, Zap } from 'lucide-react';

const HomePage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Placeholder images - replace with your actual carousel images
  const carouselImages = [
    {
      id: 1,
      url: '/images/carousel-1.jpg', // Replace with your image path
      alt: 'Modern Student Housing',
      title: 'Find Your Perfect Room',
      subtitle: 'Browse hundreds of verified hostels near your campus'
    },
    {
      id: 2,
      url: '/images/carousel-2.jpg', // Replace with your image path
      alt: 'Easy Booking Process',
      title: 'Book in Minutes',
      subtitle: 'Secure, fast, and transparent booking experience'
    },
    {
      id: 3,
      url: '/images/carousel-3.jpg', // Replace with your image path
      alt: 'Manage Properties',
      title: 'Grow Your Business',
      subtitle: 'Enterprise platform for landlords to manage hostels efficiently'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Carousel */}
      <section className="relative h-[600px] bg-gray-900">
        {/* Carousel Images */}
        <div className="relative h-full overflow-hidden">
          {carouselImages.map((image, index) => (
            <div
              key={image.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${image.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50" />
              </div>

              {/* Content */}
              <div className="relative h-full flex items-center justify-center text-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                  <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                    {image.title}
                  </h1>
                  <p className="text-xl md:text-2xl mb-8 text-gray-200">
                    {image.subtitle}
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Link
                      to="/register?role=student"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Find a Room
                    </Link>
                    <Link
                      to="/register?role=landlord"
                      className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-semibold transition-colors"
                    >
                      List Your Hostel
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full backdrop-blur-sm transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full backdrop-blur-sm transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-white w-8'
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">
            Why Choose RUMI?
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16">
            The modern platform for student housing management
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Verified Listings</h3>
              <p className="text-gray-600">
                All hostels are verified by our team for quality and safety
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure Payments</h3>
              <p className="text-gray-600">
                100% secure payment processing with no hidden fees
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Matching</h3>
              <p className="text-gray-600">
                AI-powered roommate matching based on lifestyle preferences
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Instant Booking</h3>
              <p className="text-gray-600">
                Book and pay instantly - no waiting for confirmations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Students Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">For Students</h2>
              <p className="text-xl text-gray-600 mb-8">
                Find your ideal room with features that matter to you
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Browse Verified Hostels</h4>
                    <p className="text-gray-600">All listings are verified by our team</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Lifestyle Matching</h4>
                    <p className="text-gray-600">Find compatible roommates automatically</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">No Hidden Fees</h4>
                    <p className="text-gray-600">Pay exactly what you see - no surprises</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Secure Payments</h4>
                    <p className="text-gray-600">M-Pesa and card payments supported</p>
                  </div>
                </li>
              </ul>
              <Link
                to="/register?role=student"
                className="inline-block mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Get Started as Student
              </Link>
            </div>
            <div className="relative">
              <img
                src="/images/student-hero.jpg"
                alt="Student browsing rooms"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* For Landlords Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative">
              <img
                src="/images/landlord-hero.jpg"
                alt="Landlord managing properties"
                className="rounded-lg shadow-2xl"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-4xl font-bold mb-6">For Landlords</h2>
              <p className="text-xl text-gray-600 mb-8">
                Enterprise-grade platform to manage your hostels efficiently
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">30-Day Free Trial</h4>
                    <p className="text-gray-600">Full access to all features - no credit card required</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">No Commission Fees</h4>
                    <p className="text-gray-600">Keep 100% of your rent - we charge subscriptions only</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Flexible Pricing</h4>
                    <p className="text-gray-600">Choose from fixed or revenue-based plans that work for you</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">AI-Powered Insights</h4>
                    <p className="text-gray-600">Advanced analytics and smart pricing (Advanced plan)</p>
                  </div>
                </li>
              </ul>
              <Link
                to="/register?role=landlord"
                className="inline-block mt-8 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans Preview */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16">
            Choose the plan that fits your business
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Basic Plan */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-2">Basic</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">KES 10,000</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Unlimited hostels & rooms</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Payment processing</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Inventory management</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Basic analytics</span>
                </li>
              </ul>
              <Link
                to="/register?role=landlord"
                className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Medium Plan - Popular */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 transform scale-105 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Medium</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">1%</span>
                <span className="text-blue-100"> of rent revenue</span>
              </div>
              <ul className="space-y-3 mb-8 text-white">
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>All Basic features</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>Marketplace access</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>Pay as you grow!</span>
                </li>
              </ul>
              <Link
                to="/register?role=landlord"
                className="block w-full text-center bg-white hover:bg-gray-100 text-blue-600 py-3 rounded-lg font-semibold transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Advanced Plan */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-2">Advanced</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">KES 40,000</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>All Medium features</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>AI-powered insights</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Predictive analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>API access</span>
                </li>
              </ul>
              <Link
                to="/register?role=landlord"
                className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Trial Notice */}
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-600">
              🎁 <strong>All plans start with a 30-day free trial</strong> - Full access to all features!
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">10K+</div>
              <div className="text-gray-400">Happy Students</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-gray-400">Verified Hostels</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">2K+</div>
              <div className="text-gray-400">Successful Bookings</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">99%</div>
              <div className="text-gray-400">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of students and landlords using RUMI
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/register?role=student"
              className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              I'm a Student
            </Link>
            <Link
              to="/register?role=landlord"
              className="bg-transparent hover:bg-white hover:bg-opacity-10 text-white border-2 border-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              I'm a Landlord
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;