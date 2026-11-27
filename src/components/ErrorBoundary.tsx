import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected application error occurred.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed.error === 'string') {
        readable = `Database operation (${parsed.operationType} on ${parsed.path || 'unknown'}) failed: ${parsed.error}`;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, message: readable };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ElectroMart ErrorBoundary caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="font-display text-xl font-bold text-[#0B162C]">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="mt-6 h-11 px-5 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload ElectroMart</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
