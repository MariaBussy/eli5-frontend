import { useEffect, useState } from "react";

import {
  Authenticator
} from "@aws-amplify/ui-react";

function App() {

  const API_BASE =
    "https://tpocns7qc7.execute-api.us-east-1.amazonaws.com/prod";

  const [text, setText] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [history, setHistory] =
    useState([]);

  const [selectedId,
    setSelectedId] =
      useState(null);

  const [userData,
    setUserData] =
      useState(null);

  // BUILD CONVERSATIONS
  const buildConversations =
    (items) => {

      const conversations = [];

      for (
        let i = 0;
        i < items.length;
        i++
      ) {

        const current =
          items[i];

        if (
          current.role === "user"
        ) {

          const assistant =
            items[i + 1];

          conversations.push({

            id:
              current.createdAt,

            question:
              current.content,

            answer:
              assistant?.role ===
              "assistant"
                ? assistant.content
                : "Generating response...",

            createdAt:
              current.createdAt
          });
        }
      }

      return conversations;
    };

  // LOAD HISTORY
  const loadHistory =
    async (currentUser) => {

      try {

        const response =
          await fetch(
            `${API_BASE}/history?userId=${currentUser.userId}`
          );

        const data =
          await response.json();

        const safeData =
          Array.isArray(data)
            ? data
            : [];

        const conversations =
          buildConversations(
            safeData
          );

        setHistory(
          conversations
        );

        if (
          conversations.length > 0 &&
          !selectedId
        ) {

          setSelectedId(
            conversations[0].id
          );
        }

      } catch (error) {

        console.error(error);
      }
    };

  // INITIAL LOAD
  useEffect(() => {

    if (userData?.userId) {

      loadHistory(userData);
    }

  }, [userData]);

  // SELECTED CHAT
  const selectedChat =
    history.find(
      c => c.id === selectedId
    );

  // NEW CHAT
  const newChat = () => {

    setSelectedId(null);

    setText("");

    setStatus("");
  };

  // EXPLAIN
  const explain =
    async () => {

      if (!text.trim()) return;

      const currentText = text;

      const optimisticId =
        new Date().toISOString();

      const optimisticConversation = {

        id: optimisticId,

        question: currentText,

        answer:
          "Generating response...",

        createdAt:
          optimisticId
      };

      setHistory(prev => [

        optimisticConversation,

        ...prev
      ]);

      setSelectedId(
        optimisticId
      );

      setText("");

      setStatus(
        "Request queued successfully."
      );

      try {

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
                userData.userId,

              email:
                userData.signInDetails
                  .loginId
            })
          }
        );

        // POLLING
        let attempts = 0;

        const interval =
          setInterval(async () => {

            attempts++;

            try {

              const response =
                await fetch(
                  `${API_BASE}/history?userId=${userData.userId}`
                );

              const data =
                await response.json();

              const safeData =
                Array.isArray(data)
                  ? data
                  : [];

              const conversations =
                buildConversations(
                  safeData
                );

              setHistory(
                conversations
              );

              const updated =
                conversations.find(
                  c =>
                    c.question ===
                    currentText
                );

              if (
                updated &&
                updated.answer !==
                  "Generating response..."
              ) {

                setSelectedId(
                  updated.id
                );

                setStatus("");

                clearInterval(
                  interval
                );
              }

            } catch (error) {

              console.error(error);
            }

            if (
              attempts >= 15
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

    <Authenticator>

      {({ signOut, user }) => {

        if (
          user &&
          !userData
        ) {

          setUserData(user);
        }

        return (

          <div
            style={{

              display: "flex",

              height: "100vh",

              background:
                "#020b24",

              color: "white",

              fontFamily:
                "Arial"
            }}
          >

            {/* SIDEBAR */}
            <div
              style={{

                width: 320,

                background:
                  "#031133",

                borderRight:
                  "1px solid rgba(255,255,255,0.08)",

                padding: 20,

                overflowY: "auto"
              }}
            >

              <h2
                style={{
                  textAlign: "center"
                }}
              >
                Conversations
              </h2>

              <button

                onClick={newChat}

                style={{

                  width: "100%",

                  padding: 18,

                  borderRadius: 18,

                  border: "none",

                  background:
                    "#3067e8",

                  color: "white",

                  fontWeight:
                    "bold",

                  fontSize: 20,

                  marginTop: 20,

                  marginBottom: 30,

                  cursor: "pointer"
                }}
              >
                + New Chat
              </button>

              {history.map(
                (chat, index) => (

                  <div

                    key={index}

                    onClick={() =>
                      setSelectedId(
                        chat.id
                      )
                    }

                    style={{

                      padding: 20,

                      borderRadius: 20,

                      marginBottom: 18,

                      cursor: "pointer",

                      background:
                        selectedId ===
                        chat.id
                          ? "#1c2b4a"
                          : "transparent",

                      border:
                        "1px solid rgba(255,255,255,0.08)"
                    }}
                  >

                    <div
                      style={{

                        fontWeight:
                          "bold",

                        marginBottom: 10,

                        fontSize: 17
                      }}
                    >
                      {
                        chat.question
                          .length > 40
                          ? chat.question.slice(
                              0,
                              40
                            ) + "..."
                          : chat.question
                      }
                    </div>

                    <div
                      style={{

                        fontSize: 12,

                        opacity: 0.6
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

            {/* MAIN */}
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

                  padding: 30,

                  display: "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  borderBottom:
                    "1px solid rgba(255,255,255,0.08)"
                }}
              >

                <div>

                  <h1
                    style={{
                      margin: 0,
                      fontSize: 72
                    }}
                  >
                    Explain Like I'm 5
                  </h1>

                  <p
                    style={{
                      opacity: 0.6
                    }}
                  >
                    {
                      user
                        ?.signInDetails
                        ?.loginId
                    }
                  </p>

                </div>

                <button

                  onClick={signOut}

                  style={{

                    background:
                      "#ff4f4f",

                    border: "none",

                    color: "white",

                    padding:
                      "18px 28px",

                    borderRadius: 20,

                    fontSize: 18,

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

                  overflowY: "auto",

                  padding: 40
                }}
              >

                {!selectedChat ? (

                  <div
                    style={{

                      textAlign:
                        "center",

                      marginTop: 200,

                      opacity: 0.6
                    }}
                  >

                    <h2>
                      Ask anything
                    </h2>

                    <p>
                      Your simplified explanations
                      will appear here.
                    </p>

                  </div>

                ) : (

                  <>
                    {/* USER */}
                    <div
                      style={{

                        display: "flex",

                        justifyContent:
                          "flex-end",

                        marginBottom: 40
                      }}
                    >

                      <div
                        style={{

                          background:
                            "#3067e8",

                          padding: 24,

                          borderRadius: 30,

                          maxWidth: "45%"
                        }}
                      >

                        <div
                          style={{

                            fontSize: 13,

                            opacity: 0.7,

                            marginBottom: 10,

                            fontWeight:
                              "bold"
                          }}
                        >
                          You
                        </div>

                        <div
                          style={{
                            fontSize: 22,
                            lineHeight: 1.7
                          }}
                        >
                          {
                            selectedChat.question
                          }
                        </div>

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
                            "#1c2b4a",

                          padding: 34,

                          borderRadius: 30,

                          maxWidth: "75%",

                          fontSize: 22,

                          lineHeight: 1.9,

                          whiteSpace:
                            "pre-wrap"
                        }}
                      >

                        <div
                          style={{

                            fontSize: 13,

                            opacity: 0.7,

                            marginBottom: 18,

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
                  </>
                )}

              </div>

              {/* INPUT */}
              <div
                style={{

                  padding: 25,

                  borderTop:
                    "1px solid rgba(255,255,255,0.08)",

                  display: "flex",

                  gap: 20
                }}
              >

                <textarea

                  rows={2}

                  value={text}

                  onChange={(e) =>
                    setText(
                      e.target.value
                    )
                  }

                  placeholder="Ask something complicated..."

                  style={{

                    flex: 1,

                    background:
                      "transparent",

                    border:
                      "1px solid rgba(255,255,255,0.12)",

                    borderRadius: 22,

                    color: "white",

                    padding: 24,

                    fontSize: 20,

                    resize: "none",

                    outline: "none"
                  }}
                />

                <button

                  onClick={explain}

                  style={{

                    background:
                      "#4285f4",

                    border: "none",

                    color: "white",

                    padding:
                      "0 40px",

                    borderRadius: 22,

                    fontWeight:
                      "bold",

                    fontSize: 24,

                    cursor: "pointer"
                  }}
                >
                  Explain
                </button>

              </div>

              {status && (

                <div
                  style={{

                    textAlign:
                      "center",

                    paddingBottom: 18,

                    opacity: 0.7
                  }}
                >
                  {status}
                </div>
              )}

            </div>

          </div>
        );
      }}

    </Authenticator>
  );
}

export default App;
