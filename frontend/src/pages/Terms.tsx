import React from 'react';
import {
  ScaleIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Terms: React.FC = () => {
  const lastUpdated = 'October 31, 2025';

  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      icon: DocumentTextIcon,
      content: `
        By accessing and using the RUMI platform ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
        If you do not agree to abide by the above, please do not use this service.
      `
    },
    {
      id: 'description',
      title: '2. Service Description',
      icon: ScaleIcon,
      content: `
        RUMI is a student accommodation platform that connects students with verified hostels and provides a marketplace for student-to-student transactions.
        Our services include:
        - Hostel listings and booking system
        - Student marketplace for buying/selling goods
        - Community features and messaging
        - Payment processing through integrated partners
      `
    },
    {
      id: 'user-accounts',
      title: '3. User Accounts',
      icon: ShieldCheckIcon,
      content: `
        <h4>3.1 Account Creation</h4>
        <p>To use certain features of our Service, you must create an account. You agree to:</p>
        <ul>
          <li>Provide accurate, current, and complete information</li>
          <li>Maintain and update your account information</li>
          <li>Keep your password secure and confidential</li>
          <li>Accept responsibility for all activities under your account</li>
        </ul>

        <h4>3.2 Account Types</h4>
        <p>We offer two types of accounts:</p>
        <ul>
          <li><strong>Student Accounts:</strong> For students seeking accommodation and marketplace access</li>
          <li><strong>Landlord Accounts:</strong> For property owners listing accommodations</li>
        </ul>

        <h4>3.3 Account Termination</h4>
        <p>We reserve the right to terminate or suspend accounts that violate these terms.</p>
      `
    },
    {
      id: 'booking-payments',
      title: '4. Booking and Payments',
      icon: ClockIcon,
      content: `
        <h4>4.1 Bookings</h4>
        <p>All bookings are subject to availability and confirmation. We act as a platform connecting students with landlords.</p>

        <h4>4.2 Payment Processing</h4>
        <p>Payments are processed through secure third-party providers. We use M-Pesa for Kenyan transactions.</p>

        <h4>4.3 Cancellations and Refunds</h4>
        <p>Cancellation policies vary by hostel. Refunds are processed according to individual hostel policies and Kenyan consumer protection laws.</p>

        <h4>4.4 Platform Fees</h4>
        <p>We may charge service fees for certain transactions. All fees will be clearly disclosed before payment.</p>
      `
    },
    {
      id: 'user-conduct',
      title: '5. User Conduct',
      icon: ExclamationTriangleIcon,
      content: `
        <h4>5.1 Prohibited Activities</h4>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose</li>
          <li>Post false, misleading, or inappropriate content</li>
          <li>Harass, abuse, or harm other users</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Interfere with the proper functioning of the Service</li>
          <li>Violate any applicable laws or regulations</li>
        </ul>

        <h4>5.2 Content Standards</h4>
        <p>All content you post must be:</p>
        <ul>
          <li>Accurate and truthful</li>
          <li>Respectful to other users</li>
          <li>Free from harmful or offensive material</li>
          <li>Compliant with Kenyan laws</li>
        </ul>

        <h4>5.3 Marketplace Rules</h4>
        <p>When using the marketplace:</p>
        <ul>
          <li>Only sell legal, safe items</li>
          <li>Provide accurate descriptions</li>
          <li>Complete transactions promptly</li>
          <li>Communicate respectfully with buyers/sellers</li>
        </ul>
      `
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-700 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-secondary-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Terms of Service
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Please read these terms carefully before using our platform.
            </p>
            <p className="text-sm text-gray-400 mt-4">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Introduction */}
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <div className="flex items-center mb-6">
              <ScaleIcon className="w-8 h-8 text-blue-600 mr-4" />
              <h2 className="text-2xl font-bold text-gray-900">Agreement Overview</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms of Service ("Terms") govern your use of the RUMI platform and services provided by RUMI Technologies Limited.
              By using our platform, you agree to these terms and our Privacy Policy.
            </p>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms, please contact us at legal@rumi.co.ke.
            </p>
          </div>

          {/* Terms Sections */}
          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.id} className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="flex items-center mb-6">
                  <section.icon className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                </div>
                <div
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </div>
            ))}
          </div>

          {/* Additional Sections */}
          <div className="space-y-8 mt-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">6. Intellectual Property</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Service and its original content, features, and functionality are and will remain the exclusive property of RUMI Technologies Limited and its licensors.
                The Service is protected by copyright, trademark, and other laws.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You may not duplicate, copy, or reuse any portion of the HTML/CSS, JavaScript, visual design elements, or concepts without express written permission.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">7. Limitation of Liability</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                In no event shall RUMI Technologies Limited, nor its directors, employees, partners, agents, suppliers, or affiliates,
                be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation,
                loss of profits, data, use, goodwill, or other intangible losses.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We provide our Service "as is" and do not guarantee that it will be uninterrupted, timely, secure, or error-free.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">8. Termination</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever,
                including without limitation if you breach the Terms.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Upon termination, your right to use the Service will cease immediately. If you wish to terminate your account,
                you may simply discontinue using the Service.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">9. Governing Law</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms shall be interpreted and governed by the laws of the Republic of Kenya.
                Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>
              <p className="text-gray-700 leading-relaxed">
                If any provision of these Terms is held to be invalid or unenforceable, the other provisions will remain in full force and effect.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">10. Changes to Terms</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
                If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
              <p className="text-gray-700 leading-relaxed">
                What constitutes a material change will be determined at our sole discretion.
                By continuing to access or use our Service after those revisions become effective,
                you agree to be bound by the revised terms.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">11. Contact Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 font-medium">RUMI Technologies Limited</p>
                <p className="text-gray-700">Email: legal@rumi.co.ke</p>
                <p className="text-gray-700">Phone: +254 700 000 000</p>
                <p className="text-gray-700">Address: Nairobi, Kenya</p>
              </div>
            </div>
          </div>

          {/* Acceptance Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-8">
            <div className="flex items-start">
              <ShieldCheckIcon className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">By using RUMI, you acknowledge that you have read and understood these Terms of Service.</h4>
                <p className="text-blue-800 text-sm">
                  These terms are effective as of {lastUpdated}. Continued use of our platform constitutes acceptance of these terms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Terms;