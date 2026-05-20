import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";

import "./index.css";

import { Amplify } from "aws-amplify";

import awsConfig from "./aws-config";

import "@aws-amplify/ui-react/styles.css";

Amplify.configure(awsConfig);

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
