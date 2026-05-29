// apps/web/src/components/lumio/ErrorBoundary.tsx
// Phase 28: Frontend Error Boundary with Sentry Integration

'use client';

import React, { ReactNode, ErrorInfo } from 'react';
import * as Sentry from '@sentry/nextjs';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * React Error Boundary
 * Catches React component errors and displays a friendly UI
 * Automatically sends errors to Sentry
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error details
    this.setState({
      errorInfo,
    });

    // Log error details to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Error Info:', errorInfo);
    }

    // Send to Sentry with component stack
    Sentry.captureException(error, {
      level: 'error',
      tags: {
        error_boundary: 'true',
      },
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback reset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 * Friendly error message with reload button
 */
function ErrorFallback({ reset }: { reset: () => void }) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Error Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8">
            <div className="text-5xl mb-3">⚠️</div>
            <h1 className="text-2xl font-bold text-white">
              Oops! Something went wrong
            </h1>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            <p className="text-gray-700 mb-2">
              We've encountered an unexpected error and our team has been notified.
            </p>
            <p className="text-gray-600 text-sm mb-6">
              Please try refreshing the page. If the problem persists, contact support.
            </p>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                <span>🔄</span>
                <span>Reload Page</span>
              </button>
              <button
                onClick={reset}
                className="w-full bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                Try Again
              </button>
            </div>

            {/* Development Info */}
            {isDevelopment && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <details className="text-sm text-gray-600">
                  <summary className="cursor-pointer font-semibold text-gray-800 hover:text-gray-900">
                    Error Details (Dev Only)
                  </summary>
                  <pre className="mt-3 bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48 whitespace-pre-wrap break-words">
                    {/* Error details would go here */}
                    Check console for details
                  </pre>
                </details>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Error reported to our team {' '}
                <a
                  href="mailto:support@lumio.app"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  support@lumio.app
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Need help?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Try refreshing your browser (Cmd+R or Ctrl+R)
            </li>
            <li>
              • Clear your browser cache and cookies
            </li>
            <li>
              • Try a different browser or device
            </li>
            <li>
              • Check your internet connection
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
