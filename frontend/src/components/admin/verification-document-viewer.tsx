'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, CheckCircle, XCircle } from 'lucide-react';

interface Document {
  id: string;
  type: string;
  fileName: string;
  uploadedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  url: string;
}

interface VerificationDocumentViewerProps {
  documents: Document[];
  onApprove: (documentId: string) => void;
  onReject: (documentId: string, reason: string) => void;
}

export function VerificationDocumentViewer({
  documents,
  onApprove,
  onReject,
}: VerificationDocumentViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = () => {
    if (selectedDoc) {
      onApprove(selectedDoc.id);
      setSelectedDoc(null);
    }
  };

  const handleReject = () => {
    if (selectedDoc && rejectReason) {
      onReject(selectedDoc.id, rejectReason);
      setSelectedDoc(null);
      setRejectReason('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-colors"
            onClick={() => setSelectedDoc(doc)}
          >
            <div className="flex items-start justify-between mb-2">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <Badge
                variant={
                  doc.status === 'approved'
                    ? 'default'
                    : doc.status === 'rejected'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {doc.status}
              </Badge>
            </div>
            <h4 className="font-medium mb-1">{doc.type}</h4>
            <p className="text-sm text-muted-foreground">{doc.fileName}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(doc.uploadedAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.type}</DialogTitle>
            <DialogDescription>{selectedDoc?.fileName}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {selectedDoc?.url && (
              <iframe
                src={selectedDoc.url}
                className="w-full h-[500px] border rounded"
                title="Document viewer"
              />
            )}
          </div>

          <div className="flex items-center gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => window.open(selectedDoc?.url, '_blank')}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <div className="flex-1" />
            {selectedDoc?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectReason}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={handleApprove}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </div>

          {selectedDoc?.status === 'pending' && (
            <div className="pt-2">
              <textarea
                className="w-full border rounded p-2 text-sm"
                placeholder="Rejection reason (required for rejection)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
