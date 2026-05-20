import {
  useState,
  useEffect
} from "react";

import {
  Authenticator
} from "@aws-amplify/ui-react";

function Dashboard({
  user,
  signOut
}) {

  const [text, setText] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [history, setHistory] =
    useState([]);

  const API_BASE =
    "https://tpocns7qc7.execute-api.us-east-1.amazonaws.com/prod";

  // Load user history
  const loadHistory = async () => {

    try {

      const response =
        await fetch(
          `${API_BASE}/history?userId=${user.userId}`
        );

      const data =
        await response.json();

      setHistory(
  Array.isArray(data)
    ? data
    : []
);

    } catch (error) {

      console.error(error);
    }
  };

  // Load history on login
  useEffect(() => {

    if (user?.userId) {
      loadHistory();
    }

  }, [user]);

  // Generate explanation
  const explain = async () => {

    setStatus(
      "Generating explanation..."
    );

    try {

      const response =
        await fetch(
          `${API_BASE}/explain`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              text,
              userId:
                user.userId,
              email:
                user.signInDetails
                  .loginId
            })
          }
        );

      const data =
        await response.json();

      setStatus(
        data.message ||
        "Request submitted."
      );

      // Wait for async worker
      setTimeout(() => {
        loadHistory();
      }, 4000);

    } catch (error) {

      console.error(error);

      setStatus(
        "Something went wrong."
      );
    }
  };

  return (

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
        rows="3"

        value={text}

        onChange={(e) =>
          setText(e.target.value)
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
          padding: "12px 20px",
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
            background: "#f4f4f4",
            padding: 20,
            borderRadius: 10
          }}
        >

          <h2>Status</h2>

          <p>{status}</p>

        </div>
      )}

      <div
        style={{
          marginTop: 40
        }}
      >

        <h2>Your History</h2>

        {history.length === 0 && (
          <p>
            No explanations yet.
          </p>
        )}

        {history.map(
          (item, index) => (

            <div
              key={index}

              style={{
                background:
                  "#1e1e1e",

                padding: 20,

                marginBottom: 20,

                borderRadius: 10
              }}
            >

              <h3>
                Question
              </h3>

              <p>
                {item.originalText}
              </p>

              <h3>
                Explanation
              </h3>

              <p>
                {item.explanation}
              </p>

              <small>
                {item.createdAt}
              </small>

            </div>
          )
        )}

      </div>

    </div>
  );
}

function App() {

  return (

    <Authenticator>

      {({
        signOut,
        user
      }) => (

        <Dashboard
          user={user}
          signOut={signOut}
        />
      )}

    </Authenticator>
  );
}

export default App;
