import React from 'react';
import {
  HeartIcon,
  EyeIcon,
  LightBulbIcon,
  UserGroupIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const About: React.FC = () => {
  const milestones = [
    {
      year: '2024',
      event: 'Platform launched at University of Nairobi',
      icon: GlobeAltIcon
    },
    {
      year: '2025',
      event: 'Expanded to 5 universities across Kenya',
      icon: UserGroupIcon
    },
    {
      year: '2025',
      event: 'Launched integrated student marketplace',
      icon: LightBulbIcon
    }
  ];

  const values = [
    {
      title: 'Transparency',
      description: 'Clear pricing, verified information, no hidden fees',
      icon: EyeIcon,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50'
    },
    {
      title: 'Safety',
      description: 'Verified hostels, secure payments, trusted landlords',
      icon: CheckCircleIcon,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50'
    },
    {
      title: 'Community',
      description: 'Building connections between students and landlords',
      icon: HeartIcon,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
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
              About RUMI
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Revolutionizing student accommodation in Kenya with transparent, secure, and user-friendly solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Mission */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4">
                  <LightBulbIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                To revolutionize student accommodation in Kenya by providing a transparent, secure, and user-friendly platform that connects students with quality housing and essential marketplace solutions, making university life more accessible and enjoyable for everyone.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
                  <EyeIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Our Vision</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                To become the leading student accommodation platform in Africa, creating a trusted ecosystem where students can focus on their education while we handle their housing and daily needs with excellence and care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Story
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From a simple idea to a comprehensive platform serving thousands of students across Kenya.
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                Founded in 2024 by university students who experienced firsthand the challenges of finding safe, affordable accommodation in Kenya's major cities. We saw the stress and uncertainty that came with housing searches, the security concerns, and the lack of community support.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                RUMI was born from the belief that every student deserves a seamless, secure housing experience. Starting with a pilot program at the University of Nairobi, we've grown to serve students across multiple universities, providing not just accommodation but a complete ecosystem of student services.
              </p>
            </div>
          </div>

          {/* Milestones */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">Our Journey</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4">
                    <milestone.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">{milestone.year}</div>
                  <p className="text-gray-700">{milestone.event}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do, ensuring we deliver exceptional service to our community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 ${value.bgGradient}`}
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>

                <div className="relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-r ${value.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <value.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center group-hover:text-gray-800 transition-colors">
                    {value.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-center group-hover:text-gray-600 transition-colors">
                    {value.description}
                  </p>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-900 via-primary-800 to-secondary-700 text-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Our Growing Community
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Be part of the movement that's transforming student accommodation across Kenya.
            Whether you're a student looking for housing or a landlord wanting to list your property,
            RUMI is here to make the process simple and secure.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href="/register"
              className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Join as Student
              <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/landlord/register"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-white rounded-xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              List Your Hostel
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;