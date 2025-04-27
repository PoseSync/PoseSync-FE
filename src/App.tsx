import React from "react";
import HomePage from "./pages/home";
import { createGlobalStyle } from "styled-components";
import "./App.css";

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
`;

function App() {
  return (
    <>
      <GlobalStyle />
      <div>
        <header
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            padding: "1rem",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
            }}
          >
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
              }}
            >
              PoseSync
            </h1>
            <p
              style={{
                color: "#bfdbfe",
              }}
            >
              실시간 포즈 분석 플랫폼
            </p>
          </div>
        </header>

        <main>
          <HomePage />
        </main>

        <footer
          style={{
            backgroundColor: "#1f2937",
            color: "white",
            padding: "1rem",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <p>&copy; 2025 PoseSync. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

export default App;
