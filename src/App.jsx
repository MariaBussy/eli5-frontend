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

                                width: "360px",

                                height: "100%",

                                background: "#031133",

                                padding: "28px",

                                overflowY: "auto",

                                borderRight:
                                    "1px solid rgba(255,255,255,.08)",

                                boxSizing:
                                    "border-box"

                            }}
                        >

                            <h2
                                style={{
                                    marginBottom: 30,
                                    fontSize: 54
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

                                            padding: 24,

                                            cursor: "pointer",

                                            marginBottom: 16,

                                            borderRadius: 22,

                                            background:

                                                selectedChat?.id === chat.id

                                                    ?

                                                    "#1f315a"

                                                    :

                                                    "#14244a",

                                            transition:
                                                ".2s"

                                        }}

                                    >

                                        <div
                                            style={{

                                                fontSize: 26,

                                                fontWeight: 700

                                            }}
                                        >

                                            {

                                                chat.question
                                                    ?.slice(0, 35)

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

                                    padding: "40px",

                                    textAlign: "center",

                                    borderBottom:
                                        "1px solid rgba(255,255,255,.08)"

                                }}
                            >

                                <h1
                                    style={{

                                        fontSize: 96,

                                        margin: 0

                                    }}
                                >

                                    Explain Like I'm 5

                                </h1>

                                <div
                                    style={{

                                        marginTop: 10,

                                        fontSize: 24,

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

                                        position:
                                            "absolute",

                                        right: 40,

                                        top: 40,

                                        padding:
                                            "18px 32px",

                                        border: "none",

                                        borderRadius:
                                            24,

                                        background:
                                            "#ff5454",

                                        color:
                                            "white",

                                        fontSize:
                                            24,

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

                                    padding: "40px",

                                    display: "flex",

                                    flexDirection: "column"

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
                                                            "#3668e8",

                                                        padding:
                                                            "34px",

                                                        borderRadius:
                                                            "40px",

                                                        maxWidth:
                                                            420

                                                    }}
                                                >

                                                    <div
                                                        style={{

                                                            opacity: .7,

                                                            fontWeight: 700,

                                                            fontSize: 18

                                                        }}
                                                    >

                                                        You

                                                    </div>

                                                    <div
                                                        style={{

                                                            marginTop: 10,

                                                            fontSize: 42

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
                                                        50

                                                }}
                                            >

                                                <div
                                                    style={{

                                                        background:
                                                            "#1f315a",

                                                        padding:
                                                            "50px",

                                                        borderRadius:
                                                            40,

                                                        maxWidth:
                                                            1000,

                                                        width:
                                                            "100%",

                                                        textAlign:
                                                            "center"

                                                    }}
                                                >

                                                    <div
                                                        style={{

                                                            opacity: .7,

                                                            fontWeight: 700,

                                                            fontSize: 20

                                                        }}
                                                    >

                                                        ELI5 AI

                                                    </div>

                                                    <div
                                                        style={{

                                                            marginTop: 24,

                                                            fontSize: 24,

                                                            lineHeight: 1.9

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
                                        30,

                                    display:
                                        "flex",

                                    gap:
                                        24,

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

                                    placeholder=
                                    "Ask something complicated..."

                                    rows={3}

                                    style={{

                                        flex: 1,

                                        background:
                                            "#051130",

                                        color:
                                            "white",

                                        border:
                                            "1px solid rgba(255,255,255,.1)",

                                        borderRadius:
                                            30,

                                        padding:
                                            28,

                                        fontSize:
                                            24,

                                        resize:
                                            "none",

                                        outline:
                                            "none"

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

                                        width:
                                            220,

                                        background:
                                            "#4c82ff",

                                        color:
                                            "white",

                                        border:
                                            "none",

                                        borderRadius:
                                            30,

                                        fontSize:
                                            34,

                                        fontWeight:
                                            700,

                                        cursor:
                                            "pointer"

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
