import { useEffect, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";

const API =
    "https://tpocns7qc7.execute-api.us-east-1.amazonaws.com/prod";

function App() {

    const [text, setText] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [history, setHistory] =
        useState([]);

    const [selectedChat,
        setSelectedChat] =
        useState(null);

    const [currentUser,
        setCurrentUser] =
        useState(null);


    // ---------- RESET ----------

    function resetState() {

        setText("");

        setLoading(false);

        setHistory([]);

        setSelectedChat(null);

        setCurrentUser(null);

    }



    // ---------- LOAD ----------

    async function loadHistory(user) {

        if (!user)
            return;

        try {

            const userId =

                user.userId
                ||
                user.username
                ||
                user.attributes?.sub;

            const res =
                await fetch(

                    `${API}/history?userId=${encodeURIComponent(userId)}`

                );

            const data =
                await res.json();

            if (
                !Array.isArray(data)
            ) {

                setHistory([]);

                return;

            }

            const grouped = {};

            data.forEach(item => {

                const id =

                    item.conversationId
                    ||
                    "single";

                if (
                    !grouped[id]
                ) {

                    grouped[id] = {

                        id,

                        createdAt:
                            item.createdAt,

                        question: "",

                        answer: ""

                    };

                }

                if (
                    item.role === "user"
                ) {

                    grouped[id].question =
                        item.content;

                }

                if (
                    item.role === "assistant"
                ) {

                    grouped[id].answer =
                        item.content;

                }

            });

            const conversations =

                Object
                    .values(grouped)

                    .sort(

                        (a, b) =>

                            new Date(
                                b.createdAt
                            )

                            -

                            new Date(
                                a.createdAt
                            )

                    );

            setHistory(
                conversations
            );

            setSelectedChat(
                conversations[0]
                ||
                null
            );

        }
        catch (err) {

            console.log(err);

        }

    }



    // ---------- USER ----------

    useEffect(() => {

        if (
            currentUser
        ) {

            setHistory([]);

            setSelectedChat(
                null
            );

            loadHistory(
                currentUser
            );

        }

    }, [
        currentUser
    ]);



    // ---------- SEND ----------

    async function explain() {

        if (
            loading
            ||
            !text.trim()
            ||
            !currentUser
        )
            return;

        setLoading(
            true
        );

        try {

            const userId =

                currentUser.userId
                ||

                currentUser.username
                ||

                currentUser.attributes?.sub;

            const email =

                currentUser
                    .signInDetails
                    ?.loginId

                ||

                currentUser
                    .attributes
                    ?.email

                ||

                "";

            const question =
                text.trim();

            const conversationId =
                crypto.randomUUID();

            const temp = {

                id:
                    conversationId,

                createdAt:
                    new Date()
                        .toISOString(),

                question,

                answer:
                    "Generating..."

            };

            setHistory(
                prev =>
                    [
                        temp,
                        ...prev
                    ]
            );

            setSelectedChat(
                temp
            );

            setText("");

            await fetch(

                `${API}/explain`,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            text:
                                question,

                            userId,

                            email,

                            conversationId

                        })

                }

            );

            let tries = 0;

            const poll =
                setInterval(

                    async () => {

                        tries++;

                        await loadHistory(
                            currentUser
                        );

                        if (
                            tries > 20
                        ) {

                            clearInterval(
                                poll);

                            setLoading(
                                false
                            );

                        }

                    },

                    2000

                );

            setTimeout(() => {

                clearInterval(
                    poll);

                setLoading(
                    false
                );

            }, 45000);

        }
        catch (err) {

            console.log(
                err
            );

            setLoading(
                false
            );

        }

    }



    // ---------- LOGOUT ----------

    async function logout(signOut) {

        try {

            resetState();

            localStorage.clear();

            sessionStorage.clear();

            await signOut();

            window.location.replace(
                "/"
            );

        }
        catch (err) {

            console.log(err);

        }

    }



    return (

        <Authenticator>

            {({
                user,
                signOut
            }) => {

                if (
                    user &&
                    currentUser?.username !== user.username
                ) {

                    resetState();
                    setCurrentUser(user);

                }

                return (

                    <div
                        style={{

                            width: "100vw",
                            height: "100vh",

                            display: "flex",

                            background: "#020b24",

                            color: "white",

                            overflow: "hidden"

                        }}
                    >

                        {/* SIDEBAR */}

                        <div
                            style={{

                                width: "320px",

                                height: "100%",

                                background: "#031133",

                                padding: "32px",

                                overflowY: "auto",

                                boxSizing: "border-box",

                                borderRight:
                                    "1px solid rgba(255,255,255,.08)"

                            }}
                        >

                            <h2
                                style={{

                                    margin: 0,

                                    marginBottom: 30,

                                    fontSize: "44px"

                                }}
                            >

                                Conversations

                            </h2>

                            {

                                history.map(chat => (

                                    <div

                                        key={chat.id}

                                        onClick={() =>
                                            setSelectedChat(chat)
                                        }

                                        style={{

                                            padding: "24px",

                                            borderRadius: "24px",

                                            marginBottom: "18px",

                                            cursor: "pointer",

                                            background:

                                                selectedChat?.id === chat.id

                                                    ?

                                                    "#223763"

                                                    :

                                                    "#18284e"

                                        }}

                                    >

                                        <div
                                            style={{

                                                fontSize: "20px",

                                                fontWeight: 700,

                                                lineHeight: 1.5

                                            }}
                                        >

                                            {

                                                chat.question
                                                    ?.slice(
                                                        0,
                                                        50
                                                    )

                                            }

                                        </div>

                                    </div>

                                ))

                            }

                        </div>



                        {/* MAIN */}

                        <div
                            style={{

                                flex: 1,

                                height: "100%",

                                display: "flex",

                                flexDirection: "column"

                            }}
                        >

                            {/* HEADER */}

                            <div
                                style={{

                                    padding: "28px",

                                    position: "relative",

                                    textAlign: "center",

                                    borderBottom:
                                        "1px solid rgba(255,255,255,.08)"

                                }}
                            >

                                <h1
                                    style={{

                                        margin: 0,

                                        fontSize: "72px"

                                    }}
                                >

                                    Explain Like I'm 5

                                </h1>

                                <div
                                    style={{

                                        marginTop: 12,

                                        fontSize: "18px",

                                        opacity: .7

                                    }}
                                >

                                    {
                                        user
                                            ?.signInDetails
                                            ?.loginId
                                    }

                                </div>


                                <button

                                    onClick={() =>
                                        logout(
                                            signOut
                                        )
                                    }

                                    style={{

                                        position: "fixed",

                                        right: "30px",

                                        top: "30px",

                                        padding: "16px 30px",

                                        border: "none",

                                        borderRadius: "22px",

                                        background: "#ff5757",

                                        color: "white",

                                        fontSize: "24px",

                                        cursor: "pointer",

                                        zIndex: 20

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

                                    padding: "36px",

                                    display: "flex",

                                    flexDirection: "column",

                                    alignItems: "center"

                                }}
                            >

                                {

                                    selectedChat && (

                                        <>

                                            {/* USER */}

                                            <div
                                                style={{

                                                    width: "100%",

                                                    display: "flex",

                                                    justifyContent: "flex-end"

                                                }}
                                            >

                                                <div
                                                    style={{

                                                        background: "#3d6ef0",

                                                        padding: "28px",

                                                        borderRadius: "34px",

                                                        maxWidth: "420px",

                                                        width: "fit-content",

                                                        wordBreak: "break-word"

                                                    }}
                                                >

                                                    <div
                                                        style={{

                                                            opacity: .8,

                                                            fontWeight: 700

                                                        }}
                                                    >

                                                        You

                                                    </div>

                                                    <div
                                                        style={{

                                                            fontSize: "22px",

                                                            marginTop: "10px"

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

                                                    marginTop: "40px",

                                                    width: "100%",

                                                    display: "flex",

                                                    justifyContent: "center"

                                                }}
                                            >

                                                <div
                                                    style={{

                                                        background: "#223763",

                                                        padding: "42px",

                                                        borderRadius: "40px",

                                                        maxWidth: "900px",

                                                        width: "90%",

                                                        textAlign: "center"

                                                    }}
                                                >

                                                    <div
                                                        style={{

                                                            fontWeight: 700,

                                                            opacity: .7

                                                        }}
                                                    >

                                                        ELI5 AI

                                                    </div>

                                                    <div
                                                        style={{

                                                            marginTop: "22px",

                                                            fontSize: "20px",

                                                            lineHeight: 1.8

                                                        }}
                                                    >

                                                        {
                                                            selectedChat.answer
                                                        }

                                                    </div>

                                                </div>

                                            </div>

                                        </>

                                    )

                                }

                            </div>



                            {/* INPUT */}

                            <div
                                style={{

                                    padding: "28px",

                                    display: "grid",

                                    gridTemplateColumns:
                                        "1fr 220px",

                                    gap: "20px",

                                    borderTop:
                                        "1px solid rgba(255,255,255,.08)"

                                }}
                            >

                                <textarea

                                    value={
                                        text
                                    }

                                    onChange={
                                        e =>
                                            setText(
                                                e.target.value
                                            )
                                    }

                                    rows={3}

                                    placeholder=
                                    "Ask something complicated..."

                                    style={{

                                        width: "100%",

                                        background: "#07152f",

                                        color: "white",

                                        padding: "28px",

                                        fontSize: "20px",

                                        minHeight: "120px",

                                        border:
                                            "1px solid rgba(255,255,255,.08)",

                                        borderRadius: "30px",

                                        resize: "none",

                                        outline: "none"

                                    }}

                                />


                                <button

                                    disabled={
                                        loading
                                    }

                                    onClick={
                                        explain
                                    }

                                    style={{

                                        background: "#4b82ff",

                                        border: "none",

                                        borderRadius: "30px",

                                        color: "white",

                                        fontSize: "28px",

                                        fontWeight: 700,

                                        cursor: "pointer"

                                    }}

                                >

                                    {

                                        loading

                                            ?

                                            "Thinking..."

                                            :

                                            "Explain"

                                    }

                                </button>

                            </div>

                        </div>

                    </div>

                );

            }}

        </Authenticator>

    );

}

export default App;
