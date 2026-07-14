import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { store } from "./app/store";
import RootErrorBoundary from "./RootErrorBoundary";
import "./index.css";
import "./styles.css";

import { Auth0Provider } from '@auth0/auth0-react';

function setupSnippetExpander() {
  function handleKeyDown(e) {
    if (e.key !== "Enter") return;
    const active = document.activeElement;
    if (!active) return;
    const tag = active.tagName;
    const isTextInput = tag === "TEXTAREA" || (tag === "INPUT" && active.type === "text");
    const isContentEditable = active.isContentEditable;
    if (!isTextInput && !isContentEditable) return;

    let value = "";
    let selectionStart = null;
    if (isTextInput) {
      value = active.value;
      selectionStart = active.selectionStart;
    } else {
      value = active.innerText;
    }

    const beforeCaret = selectionStart != null ? value.slice(0, selectionStart) : value;
    if (!beforeCaret.trim().endsWith("rcf")) return;

    e.preventDefault();

    const before = isTextInput
      ? value.slice(0, selectionStart).replace(/rcf\s*$/,"")
      : value.replace(/rcf\s*$/,"");

    const snippet = `import React from 'react';

const ComponentName = () => {
  return (
    <div>
      {/* TODO: implement */}
    </div>
  );
};

export default ComponentName;
`;

    const after = isTextInput && selectionStart != null ? value.slice(selectionStart) : "";
    const newText = before + snippet + after;

    if (isTextInput) {
      active.value = newText;
      const pos = (before + snippet).length;
      active.setSelectionRange(pos, pos);
    } else {
      active.innerText = newText;
    }
  }

  document.addEventListener("keydown", handleKeyDown);
}
setupSnippetExpander();
 const onRedirectCallback = (appState) => {
  window.location.replace(appState?.returnTo || "/dashboard");
};
ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RootErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <Auth0Provider
  domain={import.meta.env.VITE_AUTH0_DOMAIN}
  clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
  cacheLocation="localstorage"
  useRefreshTokens={true}
  authorizationParams={{
    redirect_uri: window.location.origin + "/login",
  }}
>
      <App />
    </Auth0Provider>
        </BrowserRouter>
      </Provider>
    </RootErrorBoundary>
  </StrictMode>
);
