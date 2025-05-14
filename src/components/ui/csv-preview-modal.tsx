import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CSVTable } from '@/components/ui/csv-table';

interface CSVPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

export function CSVPreviewModal({ isOpen, onClose, fileUrl, fileName }: CSVPreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Feed Preview: {fileName}</DialogTitle>
          <DialogDescription>
            Displaying data from your product feed
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <CSVTable fileUrl={fileUrl} />
        </div>
      </DialogContent>
    </Dialog>
  );
} 