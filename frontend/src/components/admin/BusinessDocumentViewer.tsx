import React, { useState } from 'react';
import { XCircleIcon, ChevronLeftIcon, ChevronRightIcon, DocumentIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface BusinessDocument {
  id: number;
  type: 'business_license' | 'tax_certificate' | 'incorporation_certificate' | 'id_document' | 'other';
  file_url: string;
  uploaded_at: string;
  file_name?: string;
}

interface BusinessDocumentViewerProps {
  documents: BusinessDocument[];
  isOpen: boolean;
  onClose: () => void;
}

const BusinessDocumentViewer: React.FC<BusinessDocumentViewerProps> = ({ documents, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || documents.length === 0) return null;

  const currentDocument = documents[currentIndex];
  const isImage = currentDocument.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = currentDocument.file_url.match(/\.pdf$/i);

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'business_license': return 'Business License';
      case 'tax_certificate': return 'Tax Certificate';
      case 'incorporation_certificate': return 'Incorporation Certificate';
      case 'id_document': return 'ID Document';
      case 'other': return 'Other Document';
      default: return type;
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : documents.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < documents.length - 1 ? prev + 1 : 0));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentDocument.file_url;
    link.download = currentDocument.file_name || `${getDocumentTypeLabel(currentDocument.type).replace(' ', '_')}_${currentDocument.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {getDocumentTypeLabel(currentDocument.type)}
            </h3>
            <span className="text-sm text-gray-500">
              {currentIndex + 1} of {documents.length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="text-gray-600 hover:text-gray-800 p-2"
              title="Download Document"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="relative bg-gray-100 flex items-center justify-center min-h-[500px] max-h-[70vh]">
          {isImage ? (
            <img
              src={currentDocument.file_url}
              alt={getDocumentTypeLabel(currentDocument.type)}
              className="max-w-full max-h-full object-contain"
            />
          ) : isPDF ? (
            <div className="text-center p-8">
              <DocumentIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">PDF Document</p>
              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Download PDF
              </button>
            </div>
          ) : (
            <div className="text-center p-8">
              <DocumentIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Document Preview Not Available</p>
              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Download Document
              </button>
            </div>
          )}

          {/* Navigation Arrows */}
          {documents.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Document Info */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Uploaded: {new Date(currentDocument.uploaded_at).toLocaleDateString()}</span>
            <div className="flex space-x-2">
              {documents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full ${
                    index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDocumentViewer;