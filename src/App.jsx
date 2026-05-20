import {
  useState,
  useEffect,
  useRef
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

  const messagesEndRef =
    useRef(null);

  const API_BASE =
    "https://tpocns7qc7.execute-api.us-east-1.amazonaws.com/prod";

  // AUTO SCROLL
  const scrollToBottom = () => {

    messagesEndRef.current
      ?.scrollIntoView({
        behavior: "smooth"
      });
  };

  // LOAD HISTORY
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

  // LOAD HISTORY ON LOGIN
  useEffect(() => {

    if (user?.userId) {
      loadHistory();
    }

  }, [user]);

  // AUTO SCROLL WHEN HISTORY CHANGES
  useEffect(() => {

    scrollToBottom();

  }, [history]);

  // SEND MESSAGE
  const explain = async () => {

    if (!text.trim()) {
      return;
    }

    setStatus(
      "Generating explanation..."
    );

    try {

      // ADD USER MESSAGE IMMEDIATELY
      const tempUserMessage = {

        role: "user",

        content: text,

        createdAt:
          new Date().toISOString()
      };

      setHistory((prev) => [
        ...prev,
        tempUserMessage
      ]);

      const currentText = text;

      setText("");

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
              text: currentText,

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

      // POLL FOR NEW RESPONSE
      let attempts = 0;

      const interval =
        setInterval(async () => {

          attempts++;

          await loadHistory();

          if (attempts >= 10) {

            clearInterval(
              interval
            );

            setStatus("");
          }

        }, 2000);

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
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        fontFamily: "Arial",
        display: "flex",
        flexDirection: "column"
      }}
    >

      {/* HEADER */}

      <div
        style={{
          padding: 20,
          borderBottom:
            "1px solid #1e293b",

          display: "flex",

          justifyContent:
            "space-between",

          alignItems: "center"
        }}
      >

        <div>

          <h1
            style={{
              margin: 0,
              fontSize: 36
            }}
          >
            Explain Like I'm 5
          </h1>

          <p
            style={{
              color: "#94a3b8"
            }}
          >
            {user?.signInDetails
              ?.loginId}
          </p>

        </div>

        <button
          onClick={signOut}

          style={{
            background:
              "#ef4444",

            border: "none",

            padding:
              "10px 16px",

            borderRadius: 10,

            color: "white",

            cursor: "pointer",

            fontWeight: "bold"
          }}
        >
          Sign Out
        </button>

      </div>

      {/* CHAT AREA */}

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 30,
          maxWidth: 900,
          width: "100%",
          margin: "0 auto"
        }}
      >

        {history.length === 0 && (

          <div
            style={{
              textAlign: "center",
              marginTop: 120,
              color: "#94a3b8"
            }}
          >

            <h2>
              Start a conversation
            </h2>

            <p>
              Ask anything you want
              explained simply.
            </p>

          </div>
        )}

        {history.map(
          (message, index) => (

            <div
              key={index}

              style={{
                display: "flex",

                justifyContent:
                  message.role === "user"
                    ? "flex-end"
                    : "flex-start",

                marginBottom: 20
              }}
            >

              <div
                style={{
                  maxWidth: "75%",

                  padding: 18,

                  borderRadius: 18,

                  background:
                    message.role === "user"
                      ? "#2563eb"
                      : "#1e293b",

                  lineHeight: 1.8,

                  whiteSpace:
                    "pre-wrap",

                  boxShadow:
                    "0 4px 10px rgba(0,0,0,0.25)"
                }}
              >

                <div
                  style={{
                    fontSize: 13,
                    marginBottom: 8,
                    opacity: 0.7,
                    fontWeight: "bold"
                  }}
                >

                  {message.role === "user"
                    ? "You"
                    : "ELI5 AI"}

                </div>

                <div>
                  {message.content}
                </div>

                <div
                  style={{
                    marginTop: 12,
                    fontSize: 11,
                    opacity: 0.6
                  }}
                >

                  {new Date(
                    message.createdAt
                  ).toLocaleString()}

                </div>

              </div>

            </div>
          )
        )}

        <div ref={messagesEndRef} />

      </div>

      {/* INPUT */}

      <div
        style={{
          padding: 20,
          borderTop:
            "1px solid #1e293b",
          background: "#111827"
        }}
      >

        <div
          style={{
            display: "flex",
            gap: 12,
            maxWidth: 900,
            margin: "0 auto"
          }}
        >

          <textarea
            rows="2"

            value={text}

            onChange={(e) =>
              setText(e.target.value)
            }

            placeholder="Ask something..."

            style={{
              flex: 1,

              padding: 16,

              borderRadius: 14,

              border:
                "1px solid #374151",

              background:
                "#0f172a",

              color: "white",

              fontSize: 16,

              resize: "none"
            }}
          />

          <button
            onClick={explain}

            style={{
              background:
                "#3b82f6",

              border: "none",

              padding:
                "0 24px",

              borderRadius: 14,

              color: "white",

              fontWeight: "bold",

              cursor: "pointer",

              minWidth: 100
            }}
          >
            Send
          </button>

        </div>

        {status && (

          <div
            style={{
              maxWidth: 900,
              margin:
                "10px auto 0",
              color: "#94a3b8"
            }}
          >
            {status}
          </div>
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
