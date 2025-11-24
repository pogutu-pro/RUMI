import React from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, EyeIcon, DocumentIcon } from '@heroicons/react/24/outline';

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

interface SellerApplicationDetailsProps {
  application: SellerApplication;
  onViewDocuments: (documents: BusinessDocument[]) => void;
  onApprove: (applicationId: number, comments?: string) => void;
  onReject: (applicationId: number, comments: string) => void;
  isProcessing: boolean;
}

const SellerApplicationDetails: React.FC<SellerApplicationDetailsProps> = ({
  application,
  onViewDocuments,
  onApprove,
  onReject,
  isProcessing,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{application.business_name}</h3>
          <p className="text-gray-600">{application.business_type}</p>
        </div>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
          {getStatusIcon(application.status)}
          <span className="ml-2 capitalize">{application.status}</span>
        </div>
      </div>

      {/* Business Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Business Details</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="text-gray-600">{application.business_description}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <p className="text-gray-600">{application.business_address}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Type</label>
              <p className="text-gray-600">{application.business_type}</p>
            </div>
            {application.tax_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Tax ID</label>
                <p className="text-gray-600">{application.tax_id}</p>
              </div>
            )}
            {application.website && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <a href={application.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                  {application.website}
                </a>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Owner</label>
              <p className="text-gray-600">{application.user.full_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-600">{application.user.email}</p>
            </div>
            {application.user.phone_number && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="text-gray-600">{application.user.phone_number}</p>
              </div>
            )}
            {application.social_media && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Social Media</label>
                <div className="space-y-1">
                  {application.social_media.facebook && (
                    <a href={application.social_media.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 block">
                      Facebook
                    </a>
                  )}
                  {application.social_media.instagram && (
                    <a href={application.social_media.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 block">
                      Instagram
                    </a>
                  )}
                  {application.social_media.twitter && (
                    <a href={application.social_media.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 block">
                      Twitter
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">Business Documents</h4>
          <button
            onClick={() => onViewDocuments(application.documents)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            View Documents ({application.documents.length})
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {application.documents.map((doc) => (
            <div key={doc.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
              <DocumentIcon className="w-8 h-8 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {doc.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-xs text-gray-500">
                  Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      {application.products && application.products.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Sample Products</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {application.products.slice(0, 6).map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                {product.images && product.images.length > 0 && (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-md mb-3"
                  />
                )}
                <h5 className="font-medium text-gray-900">{product.name}</h5>
                <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                <p className="text-lg font-semibold text-gray-900">${product.price}</p>
              </div>
            ))}
          </div>
          {application.products.length > 6 && (
            <p className="text-sm text-gray-500 mt-2">
              And {application.products.length - 6} more products...
            </p>
          )}
        </div>
      )}

      {/* Review Actions */}
      {application.status === 'pending' && (
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Review Actions</h4>
          <div className="flex space-x-4">
            <button
              onClick={() => onApprove(application.id)}
              disabled={isProcessing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Approve Application
            </button>
            <button
              onClick={() => {
                const comments = prompt('Please provide rejection comments:');
                if (comments) onReject(application.id, comments);
              }}
              disabled={isProcessing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <XCircleIcon className="w-4 h-4 mr-2" />
              Reject Application
            </button>
          </div>
        </div>
      )}

      {/* Review Comments */}
      {application.reviewer_comments && (
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-2">Review Comments</h4>
          <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{application.reviewer_comments}</p>
          {application.reviewed_at && (
            <p className="text-sm text-gray-500 mt-2">
              Reviewed on {new Date(application.reviewed_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Timestamps */}
      <div className="border-t pt-6 text-sm text-gray-500">
        <p>Submitted: {new Date(application.submitted_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default SellerApplicationDetails;