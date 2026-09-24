import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DocumentType } from './DocumentViewer';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { DocumentPreviewDrawer } from './DocumentPreviewDrawer';

export interface PreviewOptions {
  file?: string | File | Blob | ArrayBuffer | null;
  fileName?: string;
  fileType?: DocumentType;
  title?: string;
  subtitle?: string;
  watermarkText?: string;
}

interface DocumentContextType {
  openPreview: (options: PreviewOptions) => void;
  openDrawer: (options: PreviewOptions) => void;
  closePreview: () => void;
  closeDrawer: () => void;
  isModalOpen: boolean;
  isDrawerOpen: boolean;
}

const DocumentContext = createContext<DocumentContextType | null>(null);

export const DocumentPreviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{ isOpen: boolean; options: PreviewOptions }>({
    isOpen: false,
    options: {}
  });

  const [drawerState, setDrawerState] = useState<{ isOpen: boolean; options: PreviewOptions }>({
    isOpen: false,
    options: {}
  });

  const openPreview = (options: PreviewOptions) => {
    setModalState({ isOpen: true, options });
  };

  const closePreview = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const openDrawer = (options: PreviewOptions) => {
    setDrawerState({ isOpen: true, options });
  };

  const closeDrawer = () => {
    setDrawerState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <DocumentContext.Provider
      value={{
        openPreview,
        openDrawer,
        closePreview,
        closeDrawer,
        isModalOpen: modalState.isOpen,
        isDrawerOpen: drawerState.isOpen
      }}
    >
      {children}

      {/* Global Root Modal */}
      <DocumentPreviewModal
        isOpen={modalState.isOpen}
        onClose={closePreview}
        file={modalState.options.file}
        fileName={modalState.options.fileName}
        fileType={modalState.options.fileType}
        title={modalState.options.title}
        subtitle={modalState.options.subtitle}
        watermarkText={modalState.options.watermarkText}
      />

      {/* Global Root Drawer */}
      <DocumentPreviewDrawer
        isOpen={drawerState.isOpen}
        onClose={closeDrawer}
        file={drawerState.options.file}
        fileName={drawerState.options.fileName}
        fileType={drawerState.options.fileType}
        title={drawerState.options.title}
        subtitle={drawerState.options.subtitle}
      />
    </DocumentContext.Provider>
  );
};

export function useDocumentPreview(): DocumentContextType {
  const ctx = useContext(DocumentContext);
  if (!ctx) {
    throw new Error('useDocumentPreview must be used within a DocumentPreviewProvider');
  }
  return ctx;
}
