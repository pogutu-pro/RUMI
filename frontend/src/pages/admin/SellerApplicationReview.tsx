import React, { useState, useEffect } from 'react';
import { marketplaceAPI } from '../../services/api';
import SellerApplicationDetails from '../../components/admin/SellerApplicationDetails';
import BusinessDocumentViewer from '../../components/admin/BusinessDocumentViewer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FunnelIcon, MagnifyingGlassIcon, EyeIcon } from '@heroicons/react/24/outline';

interface BusinessDocument {
  id: number;
  type: 'business_license' | 'tax_certificate' | 'incorporation_certificate' | 'id_document' | 'other';
  file_url: string;
  uploaded_at: string;
  file_name?: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  status: 'active' | 'inactive';
}

interface SellerApplication {
  id: number;
  user: {
    id: number;
    email: string;
    full_name: string;
    phone_number?: string;
  };
  business_name: string;
  business_description: string;
  business_address: string;
  business_type: string;
  tax_id?: string;
  website?: string;
  social_media?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  documents: BusinessDocument[];
  products: Product[];
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewer_comments?: string;
}

const SellerApplicationReview: React.FC = () => {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<SellerApplication | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<BusinessDocument[]>([]);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingApplication, setProcessingApplication] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    business_type: ''
  });

  useEffect(() => {
    fetchApplications();
  }, [filters]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};

      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.business_type) params.business_type = filters.business_type;

      const response = await marketplaceAPI.getSellerApplications(params);
      setApplications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch seller applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (application: SellerApplication) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const handleViewDocuments = (documents: BusinessDocument[]) => {
    setSelectedDocuments(documents);
    setShowDocumentViewer(true);
  };

  const handleApproveApplication = async (applicationId: number, comments?: string) => {
    try {
      setProcessingApplication(applicationId);
      await marketplaceAPI.approveSellerApplication(applicationId.toString(), { comments });

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId
            ? { ...app, status: 'approved', reviewed_at: new Date().toISOString(), reviewer_comments: comments }
            : app
        )
      );

      setShowDetailsModal(false);
      setSelectedApplication(null);
    } catch (error) {
      console.error('Failed to approve application:', error);
      alert('Failed to approve application. Please try again.');
    } finally {
      setProcessingApplication(null);
    }
  };

  const handleRejectApplication = async (applicationId: number, comments: string) => {
    try {
      setProcessingApplication(applicationId);
      await marketplaceAPI.rejectSellerApplication(applicationId.toString(), { comments });

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId
            ? { ...app, status: 'rejected', reviewed_at: new Date().toISOString(), reviewer_comments: comments }
            : app
        )
      );

      setShowDetailsModal(false);
      setSelectedApplication(null);
    } catch (error) {
      console.error('Failed to reject application:', error);
      alert('Failed to reject application. Please try again.');
    } finally {
      setProcessingApplication(null);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        app.business_name.toLowerCase().includes(searchTerm) ||
        app.user.full_name.toLowerCase().includes(searchTerm) ||
        app.user.email.toLowerCase().includes(searchTerm) ||
        app.business_type.toLowerCase().includes(searchTerm)
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
          <h1 className="text-3xl font-bold text-gray-900">Seller Application Review</h1>
          <p className="text-gray-600">Review and approve marketplace seller applications</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
            <select
              value={filters.business_type}
              onChange={(e) => setFilters(prev => ({ ...prev, business_type: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="service">Service</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="other">Other</option>
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
                placeholder="Search by business name, owner, email, or type"
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
            {filters.status || filters.search || filters.business_type ? 'Try adjusting your filters' : 'No seller applications yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredApplications.map((application) => (
            <div key={application.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{application.business_name}</h3>
                  <p className="text-gray-600">{application.business_type}</p>
                </div>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  application.status === 'approved' ? 'bg-green-100 text-green-800' :
                  application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {application.status}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Owner:</span> {application.user.full_name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {application.user.email}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Submitted:</span> {new Date(application.submitted_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Documents:</span> {application.documents.length}
                </p>
                {application.products && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Products:</span> {application.products.length}
                  </p>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewDetails(application)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <EyeIcon className="w-4 h-4 mr-2" />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SellerApplicationDetails
                application={selectedApplication}
                onViewDocuments={handleViewDocuments}
                onApprove={handleApproveApplication}
                onReject={handleRejectApplication}
                isProcessing={processingApplication === selectedApplication.id}
              />
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      <BusinessDocumentViewer
        documents={selectedDocuments}
        isOpen={showDocumentViewer}
        onClose={() => setShowDocumentViewer(false)}
      />
    </div>
  );
};

export default SellerApplicationReview;