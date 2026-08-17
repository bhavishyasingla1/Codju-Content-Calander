import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          margin: '20px',
          background: 'var(--color-bg-elevated, #fff)',
          border: '1px solid #FCA5A5',
          borderRadius: '12px',
          color: '#DC2626',
          fontFamily: 'sans-serif'
        }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Something went wrong displaying this section</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#666' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: '#4F46E5',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
