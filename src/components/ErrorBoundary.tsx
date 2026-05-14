import React from 'react';
import * as Sentry from '@sentry/react';

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
    // Forward sang Sentry (chỉ active khi VITE_SENTRY_DSN có giá trị + PROD).
    Sentry.captureException(error, { extra: { componentStack: info.componentStack ?? '' } });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Đã xảy ra lỗi</h2>
          <p className="text-sm text-slate-500 mb-4 max-w-md">
            {this.state.error?.message || 'Lỗi không xác định'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
          >
            Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
