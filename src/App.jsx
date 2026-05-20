import { useState } from "react";

import {
  Authenticator
} from "@aws-amplify/ui-react";

function App() {

  const [text, setText] =
    useState("");

  const [status, setStatus] =
    useState("");

  const API_URL =
    "https://tpocns7qc7.execute-api.us-east-1.amazonaws.com/prod/explain";

  const explain = async () => {

    setStatus("Generating explanation...");

    try {

      const response = await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            text
          })
        }
      );

      const data =
        await response.json();

      setStatus(
        data.message ||
        "Request submitted."
      );

    } catch (error) {

      console.error(error);

      setStatus(
        "Something went wrong."
      );
    }
  };

  return (

    <Authenticator>

      {({ signOut, user }) => (

        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: 40,
            fontFamily: "Arial"
          }}
        >

          <h1>
            Explain Like I'm 5
          </h1>

          <p>
            Welcome,
            {" "}
            {user?.signInDetails
              ?.loginId}
          </p>

          <button
            onClick={signOut}
            style={{
              marginBottom: 20
            }}
          >
            Sign Out
          </button>

          <textarea
            rows="10"

            value={text}

            onChange={(e) =>
              setText(
                e.target.value
              )
            }

            placeholder="Paste difficult text here..."

            style={{
              width: "100%",
              padding: 15,
              fontSize: 16
            }}
          />

          <button
            onClick={explain}

            style={{
              marginTop: 20,
              padding:
                "12px 20px",
              fontSize: 16,
              cursor: "pointer"
            }}
          >
            Explain
          </button>

          {status && (
            <div
              style={{
                marginTop: 30,
                background:
                  "#f4f4f4",
                padding: 20,
                borderRadius: 10
              }}
            >
              <h2>Status</h2>

              <p>{status}</p>
            </div>
          )}

        </div>
      )}

    </Authenticator>
  );
}

export default App;
