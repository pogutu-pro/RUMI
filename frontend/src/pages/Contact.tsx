import React, { useState } from 'react';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    subject: '',
    inquiry_type: 'general',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const inquiryTypes = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'student_support', label: 'Student Support' },
    { value: 'landlord_support', label: 'Landlord Support' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'media', label: 'Media Inquiry' },
    { value: 'other', label: 'Other' }
  ];

  const contactInfo = {
    email: 'hello@rumi.co.ke',
    support_email: 'support@rumi.co.ke',
    phone: '+254 700 000 000',
    whatsapp: '+254 700 000 000',
    address: {
      street: '123 University Way',
      city: 'Nairobi',
      country: 'Kenya',
      postal_code: '00100'
    },
    social_media: {
      facebook: 'https://facebook.com/rumikenya',
      twitter: 'https://twitter.com/rumikenya',
      instagram: 'https://instagram.com/rumikenya',
      linkedin: 'https://linkedin.com/company/rumikenya'
    },
    office_hours: {
      weekdays: '8:00 AM - 6:00 PM EAT',
      saturday: '9:00 AM - 2:00 PM EAT',
      sunday: 'Closed'
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real app, you would make an API call here
      // const response = await fetch('/api/v1/home/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      setSubmitStatus('success');
      setFormData({
        full_name: '',
        email: '',
        phone_number: '',
        subject: '',
        inquiry_type: 'general',
        message: ''
      });
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
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
              Get In Touch
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Have questions about RUMI? We're here to help. Reach out to us and we'll respond within 24 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>

              {submitStatus === 'success' && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                  <div>
                    <p className="text-green-800 font-medium">Message sent successfully!</p>
                    <p className="text-green-600 text-sm">Thank you for contacting us. We'll respond within 24 hours.</p>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                  <ExclamationCircleIcon className="w-5 h-5 text-red-500 mr-3" />
                  <div>
                    <p className="text-red-800 font-medium">Failed to send message</p>
                    <p className="text-red-600 text-sm">Please try again or contact us directly.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+254 700 000 000"
                    />
                  </div>
                  <div>
                    <label htmlFor="inquiry_type" className="block text-sm font-medium text-gray-700 mb-2">
                      Inquiry Type *
                    </label>
                    <select
                      id="inquiry_type"
                      name="inquiry_type"
                      value={formData.inquiry_type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {inquiryTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of your inquiry"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Please provide details about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Contact Details */}
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h3>

                <div className="space-y-6">
                  <div className="flex items-start">
                    <EnvelopeIcon className="w-6 h-6 text-blue-600 mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">General Inquiries</p>
                      <a href={`mailto:${contactInfo.email}`} className="text-blue-600 hover:text-blue-800">
                        {contactInfo.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <EnvelopeIcon className="w-6 h-6 text-green-600 mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Support</p>
                      <a href={`mailto:${contactInfo.support_email}`} className="text-green-600 hover:text-green-800">
                        {contactInfo.support_email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <PhoneIcon className="w-6 h-6 text-purple-600 mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Phone & WhatsApp</p>
                      <a href={`tel:${contactInfo.phone}`} className="text-purple-600 hover:text-purple-800 block">
                        {contactInfo.phone}
                      </a>
                      <a href={`https://wa.me/${contactInfo.whatsapp.replace(/\s+/g, '')}`} className="text-purple-600 hover:text-purple-800 block">
                        WhatsApp: {contactInfo.whatsapp}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPinIcon className="w-6 h-6 text-red-600 mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Address</p>
                      <p className="text-gray-700">
                        {contactInfo.address.street}<br />
                        {contactInfo.address.city}, {contactInfo.address.country} {contactInfo.address.postal_code}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <ClockIcon className="w-6 h-6 text-orange-600 mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Office Hours</p>
                      <div className="text-gray-700 space-y-1">
                        <p>Weekdays: {contactInfo.office_hours.weekdays}</p>
                        <p>Saturday: {contactInfo.office_hours.saturday}</p>
                        <p>Sunday: {contactInfo.office_hours.sunday}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Follow Us</h3>
                <div className="grid grid-cols-2 gap-4">
                  <a
                    href={contactInfo.social_media.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Facebook
                  </a>
                  <a
                    href={contactInfo.social_media.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                  >
                    Twitter
                  </a>
                  <a
                    href={contactInfo.social_media.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    Instagram
                  </a>
                  <a
                    href={contactInfo.social_media.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-4 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center mb-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                  <h4 className="font-semibold text-green-800">Quick Response Guarantee</h4>
                </div>
                <p className="text-green-700 text-sm">
                  We respond to all inquiries within 24 hours during business days.
                  For urgent matters, please call us directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;