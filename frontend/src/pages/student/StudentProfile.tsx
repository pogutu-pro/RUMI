import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { authAPI } from '../../services/api';
import {
  UserIcon,
  CameraIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface StudentProfile {
  id: string;
  university: string;
  student_id_number: string;
  year_of_study: number;
  course: string;
  bio: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  is_profile_complete: boolean;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  profile_picture: string | null;
}

const StudentProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

  const yearsOfStudy = Array.from({ length: 6 }, (_, i) => i + 1);
  const relationships = ['Parent', 'Sibling', 'Friend', 'Guardian', 'Other'];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setProfile(response.data.student_profile);
      setUserData(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (profile) {
      setProfile({ ...profile, [field]: value });
    }
    if (userData && ['first_name', 'last_name', 'phone_number'].includes(field)) {
      setUserData({ ...userData, [field]: value });
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfilePicture = async (): Promise<string | null> => {
    if (!profilePictureFile) return null;

    try {
      const formData = new FormData();
      formData.append('profile_picture', profilePictureFile);

      const response = await authAPI.uploadProfilePicture(formData);
      return response.data.profile_picture_url;
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      return null;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let profilePictureUrl = null;
      
      if (profilePictureFile) {
        profilePictureUrl = await uploadProfilePicture();
        if (profilePictureUrl && userData) {
          setUserData({ ...userData, profile_picture: profilePictureUrl });
        }
      }

      const updateData = {
        ...userData,
        student_profile: profile,
        ...(profilePictureUrl && { profile_picture: profilePictureUrl })
      };

      await authAPI.updateProfile(updateData);
      
      // Refresh user context to update any cached data
      await refreshUser();
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
    }
  };

  const calculateCompletionPercentage = () => {
    if (!profile || !userData) return 0;

    const requiredFields = [
      'university', 'course', 'year_of_study', 'student_id_number',
      'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
      'first_name', 'last_name', 'phone_number'
    ];

    let completed = 0;
    requiredFields.forEach(field => {
      if (field in profile && profile[field as keyof StudentProfile]) {
        completed++;
      } else if (field in userData && userData[field as keyof User]) {
        completed++;
      }
    });

    return Math.round((completed / requiredFields.length) * 100);
  };

  const isFormValid = () => {
    if (!profile || !userData) return false;

    const required = [
      userData.first_name, userData.last_name, userData.phone_number,
      profile.university, profile.course, profile.year_of_study,
      profile.emergency_contact_name, profile.emergency_contact_phone
    ];

    return required.every(field => field && field.toString().trim() !== '');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile || !userData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load profile data</p>
        </div>
      </DashboardLayout>
    );
  }

  const completionPercentage = calculateCompletionPercentage();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                {profilePicturePreview || userData.profile_picture ? (
                  <img
                    src={profilePicturePreview || userData.profile_picture || ''}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-12 w-12 text-gray-600" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-1 bg-primary-600 rounded-full cursor-pointer hover:bg-primary-700">
                <CameraIcon className="h-4 w-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {userData.first_name} {userData.last_name}
              </h1>
              <p className="text-gray-600">{userData.email}</p>
              <p className="text-sm text-gray-500">{profile.university}</p>
              <div className="mt-3">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{completionPercentage}%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Profile completion</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow border">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'personal', label: 'Personal Info', icon: UserIcon },
                { id: 'academic', label: 'Academic', icon: AcademicCapIcon },
                { id: 'emergency', label: 'Emergency Contact', icon: PhoneIcon }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={userData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={userData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={userData.phone_number || ''}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    placeholder="+254712345678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profile.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            )}

            {/* Academic Tab */}
            {activeTab === 'academic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    University *
                  </label>
                  <input
                    type="text"
                    value={profile.university}
                    onChange={(e) => handleInputChange('university', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course of Study *
                  </label>
                  <input
                    type="text"
                    value={profile.course}
                    onChange={(e) => handleInputChange('course', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year of Study *
                  </label>
                  <select
                    value={profile.year_of_study || ''}
                    onChange={(e) => handleInputChange('year_of_study', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select year</option>
                    {yearsOfStudy.map(year => (
                      <option key={year} value={year}>Year {year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID Number
                  </label>
                  <input
                    type="text"
                    value={profile.student_id_number || ''}
                    onChange={(e) => handleInputChange('student_id_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Emergency Contact Tab */}
            {activeTab === 'emergency' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Name *
                  </label>
                  <input
                    type="text"
                    value={profile.emergency_contact_name || ''}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Phone *
                  </label>
                  <input
                    type="tel"
                    value={profile.emergency_contact_phone || ''}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                    placeholder="+254712345678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship
                  </label>
                  <select
                    value={profile.emergency_contact_relationship || ''}
                    onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select relationship</option>
                    {relationships.map(rel => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {completionPercentage === 100 ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                )}
                <span className="text-sm text-gray-600">
                  {completionPercentage === 100
                    ? 'Profile complete!'
                    : `${100 - completionPercentage}% remaining to complete profile`}
                </span>
              </div>
              <button
                onClick={handleSave}
                disabled={!isFormValid() || saving}
                className={`px-6 py-2 rounded-lg font-medium ${
                  isFormValid() && !saving
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfilePage;