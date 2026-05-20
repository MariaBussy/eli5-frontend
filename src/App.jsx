import { useEffect, useMemo, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";

const API_BASE =
  "https://tpocns7qc7.execute-api.us-east-1.amazonaws.com/prod";

function App() {

  const [text, setText] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [history, setHistory] =
    useState([]);

  const [
    selectedConversationId,
    setSelectedConversationId
  ] = useState(null);

  const [
    userData,
    setUserData
  ] = useState(null);

  // LOAD HISTORY
  const loadHistory = async (
    currentUser
  ) => {

    if (!currentUser?.userId)
      return;

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

      // SORT
      safeData.sort(
        (a, b) =>
          new Date(a.createdAt) -
          new Date(b.createdAt)
      );

      setHistory(safeData);

      // AUTO-SELECT MOST RECENT CHAT
      if (
        safeData.length > 0 &&
        !selectedConversationId
      ) {

        const latest =
          safeData[
            safeData.length - 1
          ];

        setSelectedConversationId(
          latest.conversationId
        );
      }

    } catch (error) {

      console.error(error);
    }
  };

  // LOAD ON LOGIN
  useEffect(() => {

    if (userData?.userId) {

      loadHistory(userData);
    }

  }, [userData]);

  // GROUP CONVERSATIONS
  const conversations =
    useMemo(() => {

      const grouped = {};

      history.forEach(item => {

        if (
          !grouped[
            item.conversationId
          ]
        ) {

          grouped[
            item.conversationId
          ] = [];
        }

        grouped[
          item.conversationId
        ].push(item);
      });

      return Object.entries(
        grouped
      )
        .map(
          ([conversationId, messages]) => {

            const firstUserMessage =
              messages.find(
                m =>
                  m.role ===
                  "user"
              );

            return {

              conversationId,

              title:
                firstUserMessage
                  ?.content ||
                "New Chat",

              createdAt:
                firstUserMessage
                  ?.createdAt,

              messages
            };
          }
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ) -
            new Date(
              a.createdAt
            )
        );

    }, [history]);

  // SELECTED CHAT
  const selectedMessages =
    history.filter(
      item =>
        item.conversationId ===
        selectedConversationId
    );

  // NEW CHAT
  const newChat = () => {

    const id =
      crypto.randomUUID();

    setSelectedConversationId(
      id
    );

    setText("");

    setStatus("");
  };

  // EXPLAIN
  const explain = async () => {

    if (!text.trim())
      return;

    if (!userData)
      return;

    const currentText =
      text;

    // USE EXISTING CHAT
    let conversationId =
      selectedConversationId;

    // CREATE ONLY IF NONE
    if (!conversationId) {

      conversationId =
        crypto.randomUUID();

      setSelectedConversationId(
        conversationId
      );
    }

    // TEMP USER
    const userMessage = {

      conversationId,

      role: "user",

      content:
        currentText,

      createdAt:
        new Date().toISOString()
    };

    // TEMP AI
    const assistantMessage = {

      conversationId,

      role:
        "assistant",

      content:
        "Generating response...",

      createdAt:
        new Date().toISOString()
    };

    setHistory(prev => [

      ...prev,

      userMessage,

      assistantMessage
    ]);

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

            text:
              currentText,

            userId:
              userData.userId,

            email:
              userData
                .signInDetails
                .loginId,

            conversationId
          })
        }
      );

      // POLL
      let attempts = 0;

      const interval =
        setInterval(
          async () => {

            attempts++;

            try {

              await loadHistory(
                userData
              );

              const updated =
                await fetch(
                  `${API_BASE}/history?userId=${userData.userId}`
                );

              const latest =
                await updated.json();

              const safeLatest =
                Array.isArray(
                  latest
                )
                  ? latest
                  : [];

              const assistantReady =
                safeLatest.some(
                  item =>

                    item.conversationId ===
                      conversationId &&

                    item.role ===
                      "assistant" &&

                    item.content !==
                      "Generating response..."
                );

              if (
                assistantReady
              ) {

                clearInterval(
                  interval
                );

                setStatus("");
              }

            } catch (error) {

              console.error(
                error
              );
            }

            if (
              attempts >= 20
            ) {

              clearInterval(
                interval
              );

              setStatus("");
            }

          },

          2000
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

      {({
        signOut,
        user
      }) => {

        // SAVE USER
        if (
          !userData &&
          user
        ) {

          setUserData(user);
        }

        return (

          <div
            style={{
              display: "flex",
              height: "100vh",
              background:
                "#020b2d",
              color: "white",
              fontFamily:
                "Arial"
            }}
          >

            {/* SIDEBAR */}
            <div
              style={{
                width: 340,
                borderRight:
                  "1px solid rgba(255,255,255,0.1)",
                padding: 20,
                overflowY:
                  "auto"
              }}
            >

              <h2
                style={{
                  textAlign:
                    "center"
                }}
              >
                Conversations
              </h2>

              <button
                onClick={
                  newChat
                }
                style={{
                  width:
                    "100%",
                  padding: 20,
                  borderRadius: 18,
                  border:
                    "none",
                  background:
                    "#3b82f6",
                  color:
                    "white",
                  fontSize: 18,
                  fontWeight:
                    "bold",
                  cursor:
                    "pointer",
                  marginBottom: 30
                }}
              >
                + New Chat
              </button>

              {conversations.map(
                convo => (

                  <div
                    key={
                      convo.conversationId
                    }
                    onClick={() =>
                      setSelectedConversationId(
                        convo.conversationId
                      )
                    }
                    style={{
                      padding: 25,
                      borderRadius: 22,
                      marginBottom: 20,
                      cursor:
                        "pointer",
                      background:
                        selectedConversationId ===
                        convo.conversationId
                          ? "rgba(255,255,255,0.12)"
                          : "transparent",
                      border:
                        "1px solid rgba(255,255,255,0.08)"
                    }}
                  >

                    <h3
                      style={{
                        margin: 0,
                        fontSize: 18
                      }}
                    >
                      {convo.title.slice(
                        0,
                        28
                      )}
                    </h3>

                    <p
                      style={{
                        opacity: 0.6,
                        fontSize: 14
                      }}
                    >
                      {new Date(
                        convo.createdAt
                      ).toLocaleString()}
                    </p>

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
                    "1px solid rgba(255,255,255,0.1)",
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
                      fontSize: 72
                    }}
                  >
                    Explain
                    Like
                    I'm 5
                  </h1>

                  <p
                    style={{
                      opacity: 0.7
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
                  onClick={
                    signOut
                  }
                  style={{
                    background:
                      "#ff5252",
                    color:
                      "white",
                    border:
                      "none",
                    borderRadius: 20,
                    padding:
                      "20px 35px",
                    fontSize: 18,
                    fontWeight:
                      "bold",
                    cursor:
                      "pointer"
                  }}
                >
                  Sign Out
                </button>

              </div>

              {/* CHAT */}
              <div
                style={{
                  flex: 1,
                  overflowY:
                    "auto",
                  padding: 40,
                  display: "flex",
                  flexDirection:
                    "column",
                  gap: 30
                }}
              >

                {selectedMessages.length ===
                0 ? (

                  <div
                    style={{
                      textAlign:
                        "center",
                      opacity: 0.6,
                      marginTop: 120
                    }}
                  >

                    <h2>
                      Ask
                      anything
                    </h2>

                    <p>
                      Your
                      simplified
                      explanations
                      will
                      appear
                      here.
                    </p>

                  </div>

                ) : (

                  selectedMessages.map(
                    (
                      message,
                      index
                    ) => (

                      <div
                        key={
                          index
                        }
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            message.role ===
                            "user"
                              ? "flex-end"
                              : "flex-start"
                        }}
                      >

                        <div
                          style={{
                            maxWidth:
                              "65%",
                            padding: 35,
                            borderRadius: 28,
                            background:
                              message.role ===
                              "user"
                                ? "#3b82f6"
                                : "#1f2d52",
                            lineHeight: 1.8,
                            fontSize: 18,
                            boxShadow:
                              "0 8px 30px rgba(0,0,0,0.25)"
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
                            {message.role ===
                            "user"
                              ? "You"
                              : "ELI5 AI"}
                          </div>

                          <div
                            style={{
                              whiteSpace:
                                "pre-wrap"
                            }}
                          >
                            {
                              message.content
                            }
                          </div>

                        </div>

                      </div>
                    )
                  )
                )}

              </div>

              {/* INPUT */}
              <div
                style={{
                  padding: 30,
                  borderTop:
                    "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  gap: 20
                }}
              >

                <textarea
                  value={text}
                  onChange={e =>
                    setText(
                      e.target.value
                    )
                  }
                  placeholder="Ask something complicated..."
                  rows={2}
                  style={{
                    flex: 1,
                    background:
                      "transparent",
                    border:
                      "1px solid rgba(255,255,255,0.2)",
                    color:
                      "white",
                    borderRadius: 24,
                    padding: 30,
                    fontSize: 18,
                    resize:
                      "none",
                    outline:
                      "none"
                  }}
                />

                <button
                  onClick={
                    explain
                  }
                  style={{
                    width: 220,
                    border:
                      "none",
                    borderRadius: 28,
                    background:
                      "#4f8dfd",
                    color:
                      "white",
                    fontSize: 24,
                    fontWeight:
                      "bold",
                    cursor:
                      "pointer"
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
                    paddingBottom: 15,
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
