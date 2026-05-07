import { Component } from "react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  filePath?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state
      return (
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            {this.props.filePath && (
              <p className="font-mono text-[10px] text-muted-foreground/60">
                {this.props.filePath}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {error?.message ?? "Could not open this file"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="text-[10px] text-primary underline"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
