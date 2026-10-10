import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error: error, errorInfo: errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 bg-red-100 min-h-screen text-red-900 font-mono">
                    <h1 className="text-3xl font-bold mb-4">Something went wrong.</h1>
                    <details className="whitespace-pre-wrap">
                        <summary className="mb-2 font-bold cursor-pointer">View Error Details</summary>
                        <div className="bg-white p-4 rounded shadow text-sm border border-red-300">
                            <strong>{this.state.error && this.state.error.toString()}</strong>
                            <br />
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </div>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
