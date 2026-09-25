import { Component, ErrorInfo, ReactNode } from 'react'
import { ErrorState } from './ErrorState'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  errorMessage?: string
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: undefined
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || 'Rendering error' }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8 min-h-[50dvh]">
          <ErrorState 
            title="Rendering Error"
            description={this.state.errorMessage || "A visual component encountered an issue rendering in this viewport. Try reloading."}
            onRetry={() => this.setState({ hasError: false, errorMessage: undefined })}
          />
        </div>
      )
    }

    return this.props.children
  }
}
