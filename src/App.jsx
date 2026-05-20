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

  const [selectedQuestion,
    setSelectedQuestion] =
      useState(null);

  const [userData,
    setUserData] =
      useState(null);

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

        setHistory(safeData);

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

  // BUILD CONVERSATIONS
  const conversations = [];

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

      conversations.push({

        question:
          current.content,

        answer,

        createdAt:
          current.createdAt
      });
    }
  }

  // AUTO SELECT FIRST CHAT
  useEffect(() => {

    if (
      !selectedQuestion &&
      conversations.length > 0
    ) {

      setSelectedQuestion(
        conversations[0].question
      );
    }

  }, [
    conversations,
    selectedQuestion
  ]);

  // SELECTED CHAT
  const selectedChat =
    conversations.find(
      c =>
        c.question ===
        selectedQuestion
    );

  // EXPLAIN
  const explain =
    async () => {

      if (!text.trim()) return;

      const currentText = text;

      setStatus(
        "Request queued successfully."
      );

      setSelectedQuestion(
        currentText
      );

      try {

        // OPTIMISTIC UI
        const optimisticUserMessage = {

          role: "user",

          content: currentText,

          createdAt:
            new Date().toISOString()
        };

        const optimisticAssistant = {

          role: "assistant",

          content:
            "Generating response...",

          createdAt:
            new Date().toISOString()
        };

        setHistory(prev => [

          optimisticUserMessage,

          optimisticAssistant,

          ...prev
        ]);

        setText("");

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

              setHistory(safeData);

              const grouped = [];

              for (
                let i = 0;
                i < safeData.length;
                i++
              ) {

                const current =
                  safeData[i];

                if (
                  current.role === "user"
                ) {

                  let answer =
                    "Generating response...";

                  for (
                    let j = i + 1;
                    j < safeData.length;
                    j++
                  ) {

                    if (
                      safeData[j].role ===
                      "assistant"
                    ) {

                      answer =
                        safeData[j].content;

                      break;
                    }
                  }

                  grouped.push({

                    question:
                      current.content,

                    answer,

                    createdAt:
                      current.createdAt
                  });
                }
              }

              const updatedChat =
                grouped.find(
                  c =>
                    c.question ===
                    currentText
                );

              if (
                updatedChat &&
                updatedChat.answer !==
                  "Generating response..."
              ) {

                setSelectedQuestion(
                  currentText
                );

                clearInterval(
                  interval
                );

                setStatus("");
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
                "Arial, sans-serif"
            }}
          >

            {/* SIDEBAR */}
            <div
              style={{

                width: 320,

                borderRight:
                  "1px solid rgba(255,255,255,0.08)",

                padding: 20,

                overflowY: "auto",

                background:
                  "#031133"
              }}
            >

              <h2
                style={{
                  textAlign: "center",
                  marginBottom: 20
                }}
              >
                Conversations
              </h2>

              <button

                onClick={() => {

                  setSelectedQuestion(
                    null
                  );
                }}

                style={{

                  width: "100%",

                  padding: 18,

                  borderRadius: 16,

                  border: "none",

                  background:
                    "#3067e8",

                  color: "white",

                  fontWeight: "bold",

                  fontSize: 20,

                  marginBottom: 30,

                  cursor: "pointer"
                }}
              >
                + New Chat
              </button>

              {conversations.map(
                (chat, index) => (

                  <div

                    key={index}

                    onClick={() =>
                      setSelectedQuestion(
                        chat.question
                      )
                    }

                    style={{

                      padding: 20,

                      borderRadius: 20,

                      marginBottom: 18,

                      background:
                        selectedQuestion ===
                        chat.question
                          ? "#1c2b4a"
                          : "transparent",

                      border:
                        "1px solid rgba(255,255,255,0.08)",

                      cursor: "pointer"
                    }}
                  >

                    <div
                      style={{

                        fontSize: 16,

                        fontWeight:
                          "bold",

                        marginBottom: 10
                      }}
                    >
                      {
                        chat.question.length >
                        40
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

                  borderBottom:
                    "1px solid rgba(255,255,255,0.08)",

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
                      fontSize: 60,
                      margin: 0
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
                      "18px 30px",

                    borderRadius: 18,

                    fontWeight:
                      "bold",

                    fontSize: 18,

                    cursor: "pointer"
                  }}
                >
                  Sign Out
                </button>

              </div>

              {/* CHAT */}
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

                      opacity: 0.6,

                      textAlign:
                        "center",

                      marginTop: 180
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

                        marginBottom: 30
                      }}
                    >

                      <div
                        style={{

                          background:
                            "#3067e8",

                          padding: 24,

                          borderRadius: 28,

                          maxWidth: "45%"
                        }}
                      >

                        <div
                          style={{

                            fontSize: 14,

                            opacity: 0.7,

                            marginBottom: 12,

                            fontWeight:
                              "bold"
                          }}
                        >
                          You
                        </div>

                        <div
                          style={{
                            fontSize: 20,
                            lineHeight: 1.6
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

                          padding: 32,

                          borderRadius: 28,

                          maxWidth: "75%",

                          lineHeight: 1.9,

                          fontSize: 21,

                          whiteSpace:
                            "pre-wrap"
                        }}
                      >

                        <div
                          style={{

                            fontSize: 14,

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
                      "1px solid rgba(255,255,255,0.15)",

                    borderRadius: 20,

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

                    borderRadius: 20,

                    fontWeight:
                      "bold",

                    fontSize: 22,

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

                    paddingBottom: 20,

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
