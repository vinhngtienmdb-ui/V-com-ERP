import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const isDynamicImportError = 
        this.state.error?.message?.includes('dynamically imported module') ||
        this.state.error?.message?.includes('Failed to fetch') ||
        this.state.error?.message?.includes('Importing a module script failed');

      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">
            {isDynamicImportError ? 'Phiên bản giao diện đã được cập nhật' : 'Đã xảy ra lỗi'}
          </h2>
          <p className="text-sm text-slate-500 mb-4 max-w-md">
            {isDynamicImportError 
              ? 'Hệ thống vừa có cập nhật mã nguồn trên server. Vui lòng tải lại trang để tải phiên bản mới nhất.'
              : (this.state.error?.message || 'Lỗi không xác định')}
          </p>
          <button
            onClick={() => {
              if (isDynamicImportError) {
                window.location.reload();
              } else {
                this.setState({ hasError: false, error: null });
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 font-bold shadow-md cursor-pointer transition-all"
          >
            {isDynamicImportError ? 'Tải lại trang (F5)' : 'Thử lại'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
