import React from "react";

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("RootErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            background: "#050a0f",
            color: "#f4f3ee",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            fontFamily: '"Segoe UI", sans-serif',
          }}
        >
          <h1 style={{ color: "#ff9f90" }}>Something went wrong.</h1>
          <p style={{ color: "#bec5bf", maxWidth: "500px" }}>
            The application encountered an unexpected error. Please try refreshing the page or contacting support.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "20px",
              padding: "12px 24px",
              borderRadius: "999px",
              border: "none",
              background: "linear-gradient(135deg, #00d0ae 0%, #6ef5ce 100%)",
              color: "#072119",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RootErrorBoundary;