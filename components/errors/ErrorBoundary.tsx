import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import posthog from '~core/posthog'
import { DevLog } from '~utils/devUtils'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo
    })
    posthog.capture("error", {
      source: "error-boundary",
      error: error.message,
      errorInfo: errorInfo.componentStack
    })
    
    DevLog(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-4 rounded-lg bg-red-50 border border-red-200">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-sm text-red-700">
              <p className="font-medium">Error:</p>
              <pre className="mt-1 whitespace-pre-wrap">
                {this.state.error?.toString()}
              </pre>
              {this.state.errorInfo && (
                <>
                  <p className="font-medium mt-4">Component Stack:</p>
                  <pre className="mt-1 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary