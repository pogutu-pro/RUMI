import React from 'react';
import {
  UserGroupIcon,
  BriefcaseIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const Team: React.FC = () => {
  const leadership = [
    {
      id: 1,
      name: 'Joseph Ogutu',
      position: 'Chief Technology Officer',
      bio: '10+ years experience in software architecture and development. Passionate about building scalable solutions that solve real-world problems. Leading RUMI\'s technical vision and development team.',
      profile_picture: '/api/placeholder/300/300',
      email: 'joseph@rumi.co.ke',
      linkedin_url: 'https://linkedin.com/in/josephogutu',
      twitter_url: 'https://twitter.com/josephogutu',
      display_order: 1
    }
  ];

  const team = [
    {
      id: 2,
      name: 'Jane Smith',
      position: 'Head of Operations',
      bio: 'Experienced in property management and student services. Oversees hostel partnerships and ensures quality standards across all listings.',
      profile_picture: '/api/placeholder/300/300',
      email: 'jane@rumi.co.ke',
      linkedin_url: 'https://linkedin.com/in/janesmith',
      twitter_url: null,
      display_order: 2
    },
    {
      id: 3,
      name: 'David Kiprop',
      position: 'Customer Success Manager',
      bio: 'Former student housing coordinator with deep understanding of student needs. Ensures every student has a smooth experience from registration to move-in.',
      profile_picture: '/api/placeholder/300/300',
      email: 'david@rumi.co.ke',
      linkedin_url: 'https://linkedin.com/in/davidkiprop',
      twitter_url: null,
      display_order: 3
    },
    {
      id: 4,
      name: 'Grace Achieng',
      position: 'Community Manager',
      bio: 'Manages student community engagement and marketplace operations. Builds relationships between students, landlords, and the broader RUMI community.',
      profile_picture: '/api/placeholder/300/300',
      email: 'grace@rumi.co.ke',
      linkedin_url: 'https://linkedin.com/in/graceachieng',
      twitter_url: null,
      display_order: 4
    }
  ];

  interface TeamMember {
    id: number;
    name: string;
    position: string;
    bio: string;
    profile_picture: string;
    email: string;
    linkedin_url: string;
    twitter_url: string | null;
    display_order: number;
  }

  const TeamMemberCard = ({ member, isLeadership = false }: { member: TeamMember, isLeadership?: boolean }) => (
    <div className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${isLeadership ? 'border-2 border-blue-100' : ''}`}>
      {/* Profile Picture */}
      <div className="text-center mb-6">
        <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <UserGroupIcon className="w-12 h-12 text-white" />
        </div>
        {isLeadership && (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-medium mb-4">
            <SparklesIcon className="w-4 h-4 mr-1" />
            Leadership
          </div>
        )}
      </div>

      {/* Member Info */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
        <p className="text-blue-600 font-semibold mb-3">{member.position}</p>
        <p className="text-gray-700 leading-relaxed text-sm">{member.bio}</p>
      </div>

      {/* Contact Links */}
      <div className="flex justify-center space-x-4">
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors"
            title="Email"
          >
            <EnvelopeIcon className="w-5 h-5" />
          </a>
        )}
        {member.linkedin_url && (
          <a
            href={member.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors"
            title="LinkedIn"
          >
            <BriefcaseIcon className="w-5 h-5" />
          </a>
        )}
        {member.twitter_url && (
          <a
            href={member.twitter_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors"
            title="Twitter"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </a>
        )}
      </div>
    </div>
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
              Meet Our Team
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              The passionate individuals behind RUMI, dedicated to revolutionizing student accommodation in Kenya.
            </p>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Leadership Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Visionary leaders guiding RUMI's mission to transform student accommodation across Kenya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {leadership.map((member) => (
              <TeamMemberCard key={member.id} member={member} isLeadership={true} />
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Dedicated professionals working together to ensure every student has access to quality accommodation and services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* Join Us Section */}
      <section className="py-24 bg-gradient-to-r from-primary-900 via-primary-800 to-secondary-700 text-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Our Mission
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            We're always looking for talented individuals who share our passion for improving student life.
            If you're interested in joining our team, we'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/careers"
              className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              View Open Positions
              <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="mailto:careers@rumi.co.ke"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-white rounded-xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Send Us Your Resume
            </a>
          </div>

          {/* Contact Info */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-3">
                <EnvelopeIcon className="w-6 h-6" />
              </div>
              <div className="text-sm text-gray-300">careers@rumi.co.ke</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-3">
                <PhoneIcon className="w-6 h-6" />
              </div>
              <div className="text-sm text-gray-300">+254 700 000 000</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-3">
                <MapPinIcon className="w-6 h-6" />
              </div>
              <div className="text-sm text-gray-300">Nairobi, Kenya</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Team;