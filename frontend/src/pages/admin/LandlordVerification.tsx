import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import LandlordApplicationCard from '../../components/admin/LandlordApplicationCard';
import DocumentViewer from '../../components/admin/DocumentViewer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Document {
  id: number;
  type: 'id' | 'business_license' | 'property_deed';
  file_url: string;
  uploaded_at: string;
}

interface LandlordApplication {
  id: number;
  user: {
    id: number;
    email: string;
    full_name: string;
    phone_number?: string;
  };
  business_name?: string;
  business_address?: string;
  documents: Document[];
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewer_comments?: string;
}

const LandlordVerification: React.FC = () => {
  const [applications, setApplications] = useState<LandlordApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchApplications();
  }, [filters]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};

      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const response = await authAPI.getLandlordVerifications(params);
      setApplications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch landlord applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (applicationId: number, newStatus: 'approved' | 'rejected') => {
    setApplications(prev =>
      prev.map(app =>
        app.id === applicationId
          ? { ...app, status: newStatus, reviewed_at: new Date().toISOString() }
          : app
      )
    );
  };

  const handleViewDocuments = (documents: Document[]) => {
    setSelectedDocuments(documents);
    setShowDocumentViewer(true);
  };

  const filteredApplications = applications.filter(app => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        app.user.full_name.toLowerCase().includes(searchTerm) ||
        app.user.email.toLowerCase().includes(searchTerm) ||
        (app.business_name && app.business_name.toLowerCase().includes(searchTerm))
      );
    }
    return true;
  });

  const getStatusCounts = () => {
    const counts = {
      pending: applications.filter(app => app.status === 'pending').length,
      approved: applications.filter(app => app.status === 'approved').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Landlord Verification</h1>
          <p className="text-gray-600">Review and approve landlord verification applications</p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
            <p className="text-gray-600">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
            <p className="text-gray-600">Approved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
            <p className="text-gray-600">Rejected</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 mb-4">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by name, email, or business name"
                className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-4 text-gray-600">Loading applications...</span>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No applications found</p>
          <p className="text-gray-400 text-sm mt-2">
            {filters.status || filters.search ? 'Try adjusting your filters' : 'No landlord verification applications yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredApplications.map((application) => (
            <LandlordApplicationCard
              key={application.id}
              application={application}
              onStatusChange={handleStatusChange}
              onViewDocuments={handleViewDocuments}
            />
          ))}
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewer
        documents={selectedDocuments}
        isOpen={showDocumentViewer}
        onClose={() => setShowDocumentViewer(false)}
      />
    </div>
  );
};

export default LandlordVerification;