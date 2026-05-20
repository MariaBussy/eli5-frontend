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

  const [selectedChatIndex,
    setSelectedChatIndex] =
    useState(0);

  const API_BASE =
    "https://tpocns7qc7.execute-api.us-east-1.amazonaws.com/prod";

  // LOAD HISTORY
  const loadHistory =
    async () => {

    try {

      const response =
        await fetch(
          `${API_BASE}/history?userId=${user.userId}`
        );

      const data =
        await response.json();

      console.log(data);

      const safeData =
        Array.isArray(data)
          ? data
          : [];

      setHistory(safeData);

      if (
        safeData.length > 0
      ) {

        setSelectedChatIndex(0);
      }

    } catch (error) {

      console.error(error);
    }
  };

  // INITIAL LOAD
  useEffect(() => {

    if (user?.userId) {

      loadHistory();
    }

  }, [user]);

  // GROUP CHAT HISTORY
  const groupedHistory = [];

  for (
    let i = 0;
    i < history.length;
    i++
  ) {

    const current =
      history[i];

    if (
      current.role === "user"
    ) {

      let answer =
        "Generating response...";

      for (
        let j = i + 1;
        j < history.length;
        j++
      ) {

        if (
          history[j].role ===
          "assistant"
        ) {

          answer =
            history[j].content;

          break;
        }
      }

      groupedHistory.push({

        question:
          current.content,

        answer,

        createdAt:
          current.createdAt
      });
    }
  }

  // CURRENT CHAT
  const selectedChat =
    groupedHistory[
      selectedChatIndex
    ];

  // SEND MESSAGE
  const explain =
    async () => {

    if (!text.trim()) {
      return;
    }

    setStatus(
      "Generating explanation..."
    );

    try {

      const currentText =
        text;

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

              text:
                currentText,

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

      // POLL FOR RESPONSE
      let attempts = 0;

      const interval =
        setInterval(async () => {

          attempts++;

          await loadHistory();

          if (
            attempts >= 10
          ) {

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
        height: "100vh",

        background:
          "#0f172a",

        color: "white",

        display: "flex",

        fontFamily:
          "Arial, sans-serif"
      }}
    >

      {/* SIDEBAR */}

      <div
        style={{
          width: 320,

          borderRight:
            "1px solid #1e293b",

          background:
            "#111827",

          padding: 20,

          overflowY: "auto"
        }}
      >

        <h2
          style={{
            marginTop: 0
          }}
        >
          Conversations
        </h2>

        <button
          onClick={() =>
            setSelectedChatIndex(-1)
          }

          style={{
            width: "100%",

            padding: 14,

            background:
              "#2563eb",

            border: "none",

            borderRadius: 12,

            color: "white",

            fontWeight: "bold",

            cursor: "pointer",

            marginBottom: 20
          }}
        >
          + New Chat
        </button>

        {groupedHistory.map(
          (chat, index) => (

            <div
              key={index}

              onClick={() =>
                setSelectedChatIndex(
                  index
                )
              }

              style={{
                padding: 16,

                borderRadius: 14,

                marginBottom: 14,

                cursor: "pointer",

                background:
                  selectedChatIndex ===
                  index
                    ? "#1e293b"
                    : "#0f172a",

                border:
                  "1px solid #1e293b",

                transition:
                  "0.2s"
              }}
            >

              <div
                style={{
                  fontWeight:
                    "bold",

                  marginBottom: 8,

                  overflow:
                    "hidden",

                  textOverflow:
                    "ellipsis",

                  whiteSpace:
                    "nowrap"
                }}
              >

                {
                  chat.question
                }

              </div>

              <div
                style={{
                  fontSize: 12,

                  color:
                    "#94a3b8"
                }}
              >

                {new Date(
                  chat.createdAt
                ).toLocaleString()}

              </div>

            </div>
          )
        )}

      </div>

      {/* MAIN AREA */}

      <div
        style={{
          flex: 1,

          display: "flex",

          flexDirection:
            "column"
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

            alignItems:
              "center"
          }}
        >

          <div>

            <h1
              style={{
                margin: 0,

                fontSize: 42
              }}
            >
              Explain Like I'm 5
            </h1>

            <p
              style={{
                color:
                  "#94a3b8"
              }}
            >
              {
                user?.signInDetails
                  ?.loginId
              }
            </p>

          </div>

          <button
            onClick={signOut}

            style={{
              background:
                "#ef4444",

              border: "none",

              padding:
                "12px 18px",

              borderRadius: 12,

              color: "white",

              fontWeight:
                "bold",

              cursor: "pointer"
            }}
          >
            Sign Out
          </button>

        </div>

        {/* CHAT AREA */}

        <div
          style={{
            flex: 1,

            overflowY:
              "auto",

            padding: 40
          }}
        >

          {selectedChatIndex ===
            -1 && (

            <div
              style={{
                textAlign:
                  "center",

                marginTop: 120,

                color:
                  "#94a3b8"
              }}
            >

              <h2>
                Ask anything
              </h2>

              <p>
                Your simplified
                explanations will
                appear here.
              </p>

            </div>
          )}

          {selectedChat && (

            <div
              style={{
                maxWidth: 900,

                margin:
                  "0 auto"
              }}
            >

              {/* USER */}

              <div
                style={{
                  display: "flex",

                  justifyContent:
                    "flex-end",

                  marginBottom: 30
                }}
              >

                <div
                  style={{
                    background:
                      "#2563eb",

                    padding: 22,

                    borderRadius: 18,

                    maxWidth: "70%",

                    lineHeight: 1.7,

                    boxShadow:
                      "0 4px 10px rgba(0,0,0,0.3)"
                  }}
                >

                  <div
                    style={{
                      fontSize: 12,

                      opacity: 0.7,

                      marginBottom: 8,

                      fontWeight:
                        "bold"
                    }}
                  >
                    You
                  </div>

                  {
                    selectedChat.question
                  }

                </div>

              </div>

              {/* AI */}

              <div
                style={{
                  display: "flex",

                  justifyContent:
                    "flex-start"
                }}
              >

                <div
                  style={{
                    background:
                      "#1e293b",

                    padding: 24,

                    borderRadius: 18,

                    maxWidth: "75%",

                    lineHeight: 1.9,

                    whiteSpace:
                      "pre-wrap",

                    boxShadow:
                      "0 4px 10px rgba(0,0,0,0.3)"
                  }}
                >

                  <div
                    style={{
                      fontSize: 12,

                      opacity: 0.7,

                      marginBottom: 8,

                      fontWeight:
                        "bold"
                    }}
                  >
                    ELI5 AI
                  </div>

                  {
                    selectedChat.answer
                  }

                </div>

              </div>

            </div>
          )}

        </div>

        {/* INPUT AREA */}

        <div
          style={{
            padding: 24,

            borderTop:
              "1px solid #1e293b",

            background:
              "#111827"
          }}
        >

          <div
            style={{
              display: "flex",

              gap: 12,

              maxWidth: 1000,

              margin: "0 auto"
            }}
          >

            <textarea
              rows="2"

              value={text}

              onChange={(e) =>
                setText(
                  e.target.value
                )
              }

              placeholder="Ask something complicated..."

              style={{
                flex: 1,

                padding: 18,

                borderRadius: 16,

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
                  "0 28px",

                borderRadius: 16,

                color: "white",

                fontWeight:
                  "bold",

                cursor: "pointer",

                fontSize: 16
              }}
            >
              Explain
            </button>

          </div>

          {status && (

            <div
              style={{
                maxWidth: 1000,

                margin:
                  "12px auto 0",

                color:
                  "#94a3b8"
              }}
            >

              {status}

            </div>
          )}

        </div>

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
