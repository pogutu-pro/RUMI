import React, { useState } from 'react';
import { authAPI } from '../../services/api';
import { CheckCircleIcon, XCircleIcon, EyeIcon, DocumentIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

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

interface LandlordApplicationCardProps {
  application: LandlordApplication;
  onStatusChange: (applicationId: number, newStatus: 'approved' | 'rejected') => void;
  onViewDocuments: (documents: Document[]) => void;
}

const LandlordApplicationCard: React.FC<LandlordApplicationCardProps> = ({
  application,
  onStatusChange,
  onViewDocuments,
}) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !comments.trim()) {
      alert('Please provide comments for rejection');
      return;
    }

    setActionLoading(true);
    try {
      await authAPI.verifyLandlordApplication(application.id, {
        status,
        comments: comments.trim() || undefined,
      });
      onStatusChange(application.id, status);
    } catch (error) {
      console.error('Failed to update application status:', error);
      alert('Failed to update application status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'id': return 'ID Document';
      case 'business_license': return 'Business License';
      case 'property_deed': return 'Property Deed';
      default: return type;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {application.user.full_name}
            </h3>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">{application.user.email}</p>
          {application.user.phone_number && (
            <p className="text-sm text-gray-600 mb-2">{application.user.phone_number}</p>
          )}
          {application.business_name && (
            <p className="text-sm text-gray-900 font-medium">{application.business_name}</p>
          )}
          {application.business_address && (
            <p className="text-sm text-gray-600">{application.business_address}</p>
          )}
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>Submitted: {new Date(application.submitted_at).toLocaleDateString()}</p>
          {application.reviewed_at && (
            <p>Reviewed: {new Date(application.reviewed_at).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">Documents ({application.documents.length})</h4>
          <button
            onClick={() => onViewDocuments(application.documents)}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
          >
            <EyeIcon className="w-4 h-4" />
            <span>View All</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {application.documents.slice(0, 3).map((doc) => (
            <div key={doc.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
              <DocumentIcon className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-700 truncate">
                {getDocumentTypeLabel(doc.type)}
              </span>
            </div>
          ))}
          {application.documents.length > 3 && (
            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
              <span className="text-xs text-gray-500">
                +{application.documents.length - 3} more
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Reviewer Comments */}
      {application.reviewer_comments && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm font-medium text-gray-700 mb-1">Reviewer Comments:</p>
          <p className="text-sm text-gray-600">{application.reviewer_comments}</p>
        </div>
      )}

      {/* Actions */}
      {application.status === 'pending' && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowComments(!showComments)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {showComments ? 'Hide Comments' : 'Add Comments (Optional)'}
            </button>
          </div>

          {showComments && (
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add comments for this decision..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => handleAction('approved')}
              disabled={actionLoading}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {actionLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <CheckCircleIcon className="w-4 h-4" />
              )}
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleAction('rejected')}
              disabled={actionLoading}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {actionLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <XCircleIcon className="w-4 h-4" />
              )}
              <span>Reject</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandlordApplicationCard;