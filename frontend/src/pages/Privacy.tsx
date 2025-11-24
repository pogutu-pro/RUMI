import React from 'react';
import {
  ShieldCheckIcon,
  EyeIcon,
  LockClosedIcon,
  UserIcon,
  ServerIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const Privacy: React.FC = () => {
  const lastUpdated = 'October 31, 2025';

  const sections = [
    {
      id: 'introduction',
      title: '1. Introduction',
      icon: ShieldCheckIcon,
      content: `
        At RUMI, we are committed to protecting your privacy and ensuring the security of your personal information.
        This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
        By using RUMI, you agree to the collection and use of information in accordance with this policy.
      `
    },
    {
      id: 'information-collect',
      title: '2. Information We Collect',
      icon: EyeIcon,
      content: `
        <h4>2.1 Personal Information</h4>
        <p>We collect personal information that you provide directly to us, including:</p>
        <ul>
          <li>Name, email address, and phone number</li>
          <li>University and student information</li>
          <li>Profile pictures and personal descriptions</li>
          <li>Payment information (processed securely by third parties)</li>
          <li>Communication preferences</li>
        </ul>

        <h4>2.2 Usage Information</h4>
        <p>We automatically collect certain information when you use our platform:</p>
        <ul>
          <li>Device information and browser type</li>
          <li>IP address and location data</li>
          <li>Pages visited and time spent on our platform</li>
          <li>Search terms and interaction data</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>

        <h4>2.3 Third-Party Information</h4>
        <p>We may receive information from third parties, including:</p>
        <ul>
          <li>Social media platforms (if you connect your accounts)</li>
          <li>Payment processors (for transaction verification)</li>
          <li>University verification services</li>
        </ul>
      `
    },
    {
      id: 'information-use',
      title: '3. How We Use Your Information',
      icon: UserIcon,
      content: `
        <h4>3.1 Platform Operation</h4>
        <ul>
          <li>Create and manage your account</li>
          <li>Process bookings and payments</li>
          <li>Facilitate communication between users</li>
          <li>Provide customer support</li>
          <li>Send service-related notifications</li>
        </ul>

        <h4>3.2 Platform Improvement</h4>
        <ul>
          <li>Analyze usage patterns and improve our services</li>
          <li>Develop new features and functionality</li>
          <li>Conduct research and analytics</li>
          <li>Ensure platform security and prevent fraud</li>
        </ul>

        <h4>3.3 Marketing and Communication</h4>
        <ul>
          <li>Send newsletters and promotional materials (with consent)</li>
          <li>Provide personalized recommendations</li>
          <li>Share relevant updates and announcements</li>
          <li>Conduct surveys and collect feedback</li>
        </ul>

        <h4>3.4 Legal Compliance</h4>
        <ul>
          <li>Comply with legal obligations</li>
          <li>Enforce our terms of service</li>
          <li>Protect against fraudulent activities</li>
          <li>Resolve disputes and enforce agreements</li>
        </ul>
      `
    },
    {
      id: 'information-sharing',
      title: '4. Information Sharing and Disclosure',
      icon: GlobeAltIcon,
      content: `
        <h4>4.1 With Your Consent</h4>
        <p>We share your information when you explicitly consent to such sharing.</p>

        <h4>4.2 Service Providers</h4>
        <p>We share information with trusted third-party service providers who assist us in:</p>
        <ul>
          <li>Payment processing (M-Pesa, card processors)</li>
          <li>Cloud hosting and data storage</li>
          <li>Analytics and performance monitoring</li>
          <li>Email and SMS communication</li>
          <li>Customer support services</li>
        </ul>

        <h4>4.3 Business Partners</h4>
        <p>For platform functionality, we may share limited information with:</p>
        <ul>
          <li>Hostel owners (for booking facilitation)</li>
          <li>Other platform users (as necessary for transactions)</li>
          <li>University partners (for verification purposes)</li>
        </ul>

        <h4>4.4 Legal Requirements</h4>
        <p>We may disclose your information if required by law or to:</p>
        <ul>
          <li>Comply with legal processes or government requests</li>
          <li>Protect against illegal activities</li>
          <li>Safeguard the rights and safety of our users</li>
          <li>Enforce our terms of service</li>
        </ul>

        <h4>4.5 Business Transfers</h4>
        <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity.</p>
      `
    },
    {
      id: 'data-security',
      title: '5. Data Security',
      icon: LockClosedIcon,
      content: `
        <h4>5.1 Security Measures</h4>
        <p>We implement comprehensive security measures to protect your information:</p>
        <ul>
          <li>SSL/TLS encryption for data transmission</li>
          <li>Secure data storage with encryption at rest</li>
          <li>Regular security audits and vulnerability assessments</li>
          <li>Access controls and authentication systems</li>
          <li>Regular backups and disaster recovery procedures</li>
        </ul>

        <h4>5.2 Data Retention</h4>
        <p>We retain your information only as long as necessary for:</p>
        <ul>
          <li>Providing our services</li>
          <li>Complying with legal obligations</li>
          <li>Resolving disputes</li>
          <li>Enforcing our agreements</li>
        </ul>

        <h4>5.3 Data Minimization</h4>
        <p>We collect and retain only the minimum information necessary to provide our services and comply with legal requirements.</p>
      `
    },
    {
      id: 'cookies-tracking',
      title: '6. Cookies and Tracking Technologies',
      icon: ServerIcon,
      content: `
        <h4>6.1 Types of Cookies We Use</h4>
        <ul>
          <li><strong>Essential Cookies:</strong> Required for platform functionality</li>
          <li><strong>Analytics Cookies:</strong> Help us understand user behavior</li>
          <li><strong>Marketing Cookies:</strong> Used for personalized advertising</li>
          <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
        </ul>

        <h4>6.2 Managing Cookies</h4>
        <p>You can control cookies through your browser settings. However, disabling certain cookies may affect platform functionality.</p>

        <h4>6.3 Third-Party Tracking</h4>
        <p>We use third-party analytics services (like Google Analytics) to understand how our platform is used and improve our services.</p>
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
              Privacy Policy
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Your privacy is important to us. Learn how we protect and handle your personal information.
            </p>
            <p className="text-sm text-gray-400 mt-4">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Overview */}
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <div className="flex items-center mb-6">
              <ShieldCheckIcon className="w-8 h-8 text-blue-600 mr-4" />
              <h2 className="text-2xl font-bold text-gray-900">Our Commitment to Privacy</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              At RUMI, we believe that privacy is a fundamental right. We are committed to being transparent about our data practices
              and giving you control over your personal information. This policy explains how we handle your data with the utmost care and respect.
            </p>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at privacy@rumi.co.ke.
            </p>
          </div>

          {/* Privacy Sections */}
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
              <h3 className="text-xl font-bold text-gray-900 mb-6">7. Your Rights</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Under Kenyan data protection laws and international standards, you have the following rights regarding your personal information:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Right to Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal information in certain circumstances</li>
                <li><strong>Right to Restrict Processing:</strong> Request limitation of how we process your information</li>
                <li><strong>Right to Data Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or direct marketing</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">8. Children's Privacy</h3>
              <p className="text-gray-700 leading-relaxed">
                Our services are intended for users who are 18 years of age or older. We do not knowingly collect personal information
                from children under 18. If we become aware that we have collected personal information from a child under 18,
                we will take steps to delete such information promptly. If you are a parent or guardian and believe your child
                has provided us with personal information, please contact us immediately.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">9. International Data Transfers</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your information may be transferred to and processed in countries other than Kenya. When we transfer your information
                internationally, we ensure appropriate safeguards are in place to protect your data.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Our service providers and partners may be located in various countries, and we ensure they maintain adequate
                data protection standards in compliance with Kenyan law and international regulations.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">10. Changes to This Policy</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy
                on this page and updating the "Last updated" date. We will also provide more prominent notice if we make material changes.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
                Your continued use of our platform after any changes indicates your acceptance of the updated policy.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">11. Contact Us</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <EnvelopeIcon className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <a href="mailto:privacy@rumi.co.ke" className="text-blue-600 hover:text-blue-800">
                        privacy@rumi.co.ke
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Phone</p>
                      <a href="tel:+254700000000" className="text-green-600 hover:text-green-800">
                        +254 700 000 000
                      </a>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="font-medium text-gray-900">Address</p>
                  <p className="text-gray-700">RUMI Technologies Limited<br />Nairobi, Kenya</p>
                </div>
              </div>
            </div>
          </div>

          {/* Consent Notice */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mt-8">
            <div className="flex items-start">
              <ShieldCheckIcon className="w-6 h-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-green-900 mb-2">Data Protection Officer</h4>
                <p className="text-green-800 text-sm mb-2">
                  For data protection inquiries, you can contact our Data Protection Officer directly at dpo@rumi.co.ke.
                </p>
                <p className="text-green-800 text-sm">
                  We are committed to responding to your data protection concerns within 30 days of receipt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;