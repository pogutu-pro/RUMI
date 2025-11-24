import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  StarIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const features = [
    {
      icon: BuildingOfficeIcon,
      title: 'Quality Hostels',
      description: 'Find verified hostels near your university with all amenities you need.',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50'
    },
    {
      icon: ShoppingBagIcon,
      title: 'Student Marketplace',
      description: 'Buy and sell items within your university community safely.',
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50'
    },
    {
      icon: UserGroupIcon,
      title: 'Community',
      description: 'Connect with fellow students and build lasting relationships.',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Verified & Safe',
      description: 'All listings are verified for your safety and peace of mind.',
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50'
    }
  ];

  const [stats, setStats] = useState([
    { number: '0+', label: 'Hostels Listed', icon: BuildingOfficeIcon },
    { number: '0+', label: 'Happy Students', icon: UserGroupIcon },
    { number: '0+', label: 'Universities', icon: StarIcon },
    { number: '100%', label: 'Satisfaction Rate', icon: CheckCircleIcon }
  ]);

  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    // Fetch stats from backend
    // For now, we'll keep them empty as per instructions to remove hardcoded data
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-dark-950 text-white">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-secondary-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-secondary-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <SparklesIcon className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Trusted by 10,000+ Students</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
              Find Your Perfect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 via-secondary-500 to-secondary-600 animate-gradient-x">
                Student Home
              </span>
            </h1>

            <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto leading-relaxed">
              RUMI connects students with quality accommodation and marketplace solutions across universities in Kenya.
              <span className="block mt-2 text-lg text-gray-400">Safe • Verified • Community-Driven</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/hostels"
                className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-secondary-600 to-secondary-700 rounded-xl hover:from-secondary-700 hover:to-secondary-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Find Hostels
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/marketplace"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-white rounded-xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Browse Marketplace
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
                Verified Listings
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
                24/7 Support
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
                Secure Payments
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose RUMI?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We make student life easier with comprehensive solutions for accommodation and daily needs.
              Join thousands of students who trust us with their housing and marketplace needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 ${feature.bgGradient}`}
                style={{
                  animationDelay: `${index * 150}ms`,
                  background: `linear-gradient(135deg, ${feature.bgGradient.split(' ')[1]} 0%, ${feature.bgGradient.split(' ')[3]} 100%)`
                }}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

                <div className="relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed group-hover:text-gray-600 transition-colors">
                    {feature.description}
                  </p>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-r from-primary-800 via-primary-700 to-secondary-700 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 group-hover:bg-white/20 transition-all duration-300">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                    {stat.number}
                  </div>
                  <div className="text-white/80 font-medium text-sm uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Only show if there are testimonials */}
      {testimonials.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What Our Students Say
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Real experiences from students who found their perfect home and marketplace solutions with RUMI.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="relative bg-gradient-to-r from-primary-50 to-secondary-50 rounded-3xl p-8 md:p-12 shadow-xl">
                {/* Quote icon */}
                <div className="absolute top-6 left-6 text-primary-200">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                  </svg>
                </div>

                <div className="relative z-10">
                  <blockquote className="text-xl md:text-2xl font-medium text-gray-900 mb-6 leading-relaxed">
                    "{testimonials[currentTestimonial].text}"
                  </blockquote>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</div>
                      <div className="text-gray-600">{testimonials[currentTestimonial].university}</div>
                    </div>
                    <div className="flex">
                      {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Navigation dots */}
                <div className="flex justify-center mt-8 space-x-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentTestimonial ? 'bg-secondary-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-dark-950 via-primary-900 to-primary-800 text-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Join thousands of students who have found their perfect accommodation and marketplace solutions with RUMI.
            Your next chapter starts here.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-secondary-600 to-secondary-700 rounded-xl hover:from-secondary-700 hover:to-secondary-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started Free
              <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-white rounded-xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Sign In
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
              No Setup Fees
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
              Cancel Anytime
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
              24/7 Support
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;