import React from 'react';
import FallbackComponent from './FallbackComponent';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <FallbackComponent error={this.state.error?.message} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
