// components/shared/ErrorBoundary.tsx — Isolate page crashes
// Wraps sections so errors don't break the whole app

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center py-16 px-6 gap-3"
          style={{ minHeight: '40vh' }}
        >
          <span
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '20px',
              fontWeight: 300,
              color: '#e85d5d60',
              letterSpacing: '-0.01em',
            }}
          >
            {this.props.fallbackTitle || 'Algo deu errado'}
          </span>

          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              color: '#a8947840',
              textAlign: 'center',
              maxWidth: '280px',
              lineHeight: 1.5,
            }}
          >
            {this.props.fallbackMessage || 'Um erro inesperado ocorreu nesta secao'}
          </span>

          {/* Error detail (dev only) */}
          {import.meta.env.DEV && this.state.error && (
            <pre
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '10px',
                color: '#e85d5d40',
                backgroundColor: '#e85d5d08',
                borderRadius: '8px',
                padding: '8px 12px',
                maxWidth: '320px',
                overflow: 'auto',
                marginTop: '8px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.message}
            </pre>
          )}

          <button
            onClick={this.handleRetry}
            className="mt-4 transition-all duration-200 hover:opacity-80"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#c4a882',
              backgroundColor: '#c4a88210',
              border: '1px solid #c4a88225',
              borderRadius: '8px',
              padding: '10px 20px',
            }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
