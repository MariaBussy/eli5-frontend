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

                            display: "grid",

                            gridTemplateColumns:
                                "320px 1fr",

                            background: "#020b24",

                            overflow: "hidden",

                            color: "white"

                        }}
                    >

                        {/* SIDEBAR */}

                        <div
                            style={{

                                background: "#041238",

                                padding: "28px",

                                overflowY: "auto",

                                borderRight:
                                    "1px solid rgba(255,255,255,.08)"

                            }}
                        >

                            <h2
                                style={{

                                    fontSize: "34px",

                                    marginBottom: "24px"

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

                                            padding: "22px",

                                            marginBottom: "16px",

                                            borderRadius: "24px",

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

                                                fontSize: "18px",

                                                fontWeight: 700,

                                                lineHeight: 1.5

                                            }}
                                        >

                                            {
                                                chat.question
                                                    ?.slice(0, 40)
                                            }

                                        </div>

                                    </div>

                                ))

                            }

                        </div>



                        {/* MAIN */}

                        <div
                            style={{

                                display: "flex",

                                flexDirection: "column",

                                height: "100vh"

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

                                        fontSize:
                                            "clamp(48px,6vw,86px)"

                                    }}
                                >

                                    Explain Like I'm 5

                                </h1>

                                <div
                                    style={{

                                        opacity: .65,

                                        marginTop: 10,

                                        fontSize: "18px"

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

                                        position: "absolute",

                                        right: 24,

                                        top: 24,

                                        padding:
                                            "14px 24px",

                                        borderRadius:
                                            20,

                                        border: "none",

                                        background:
                                            "#ff5757",

                                        color: "white",

                                        fontSize:
                                            18,

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

                                    overflowY: "auto",

                                    padding:
                                        "30px",

                                    display: "flex",

                                    flexDirection:
                                        "column"

                                }}
                            >

                                {

                                    selectedChat && (

                                        <>

                                            <div
                                                style={{

                                                    display: "flex",

                                                    justifyContent:
                                                        "flex-end"

                                                }}
                                            >

                                                <div
                                                    style={{

                                                        background:
                                                            "#3b6cf0",

                                                        padding:
                                                            "24px",

                                                        borderRadius:
                                                            "28px",

                                                        maxWidth:
                                                            "360px"

                                                    }}
                                                >

                                                    <div
                                                        style={{

                                                            fontWeight: 700,

                                                            opacity: .7

                                                        }}
                                                    >

                                                        You

                                                    </div>

                                                    <div
                                                        style={{

                                                            marginTop: 8,

                                                            fontSize: 18,

                                                            lineHeight: 1.6

                                                        }}
                                                    >

                                                        {
                                                            selectedChat.question
                                                        }

                                                    </div>

                                                </div>

                                            </div>



                                            <div
                                                style={{

                                                    display: "flex",

                                                    justifyContent:
                                                        "center",

                                                    marginTop:
                                                        30

                                                }}
                                            >

                                                <div
                                                    style={{

                                                        background:
                                                            "#223763",

                                                        padding:
                                                            "40px",

                                                        borderRadius:
                                                            "36px",

                                                        width:
                                                            "min(900px,85%)"

                                                    }}
                                                >

                                                    <div
                                                        style={{

                                                            textAlign: "center",

                                                            fontWeight: 700,

                                                            opacity: .7

                                                        }}
                                                    >

                                                        ELI5 AI

                                                    </div>

                                                    <div
                                                        style={{

                                                            marginTop: 20,

                                                            fontSize: 20,

                                                            lineHeight: 1.9,

                                                            textAlign: "center"

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

                                    padding:
                                        "24px",

                                    display:
                                        "grid",

                                    gridTemplateColumns:
                                        "1fr 180px",

                                    gap:
                                        "18px",

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

                                        padding: "24px",

                                        borderRadius: "28px",

                                        background: "#041238",

                                        color: "white",

                                        fontSize: 18,

                                        border:
                                            "1px solid rgba(255,255,255,.08)",

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

                                        border: "none",

                                        borderRadius:
                                            28,

                                        background:
                                            "#4b82ff",

                                        color:
                                            "white",

                                        fontSize:
                                            24,

                                        fontWeight:
                                            700,

                                        cursor:
                                            "pointer"

                                    }}

                                >

                                    {

                                        loading

                                            ?

                                            "..."

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
