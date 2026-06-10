"use client";

import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#f8f9fa] gap-4 text-center px-6">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
            <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Builder encountered an error</h1>
          <p className="text-gray-500 text-[14px] max-w-md">
            Something went wrong. Try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-black text-white rounded-xl text-[13px] font-bold hover:bg-gray-900 transition-all"
          >
            Reload Builder
          </button>
          {this.state.error && (
            <pre className="text-[11px] text-gray-400 max-w-md text-left mt-2 overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
