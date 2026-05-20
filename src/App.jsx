import "./App.css";
import { useEffect, useState } from "react";
import crypto from "crypto-js";

const API_BASE =
process.env.REACT_APP_API_URL;

export default function App() {

const [userData,setUserData]=
useState(null);

const [history,setHistory]=
useState([]);

const [text,setText]=
useState("");

const [loading,setLoading]=
useState(false);

const [selectedConversationId,
setSelectedConversationId]=
useState(null);

const [status,setStatus]=
useState("");


// LOAD USER

useEffect(()=>{

const stored=
localStorage.getItem(
"user"
);

if(stored){

setUserData(
JSON.parse(
stored
)
);

}

},[]);


// LOAD HISTORY

useEffect(()=>{

if(!userData)
return;

loadHistory();

},[userData]);


const loadHistory=
async()=>{

try{

const res=
await fetch(
`${API_BASE}/history?userId=${userData.userId}`
);

const rows=
await res.json();

rows.sort(
(a,b)=>
new Date(
a.createdAt
)
-
new Date(
b.createdAt
)
);

setHistory(
rows
);

}
catch(e){

console.log(
e
);

}

};


// CONVERSATIONS

const conversations=
Object.values(

history.reduce(
(acc,msg)=>{

const id=
msg.conversationId;

if(
!acc[id]
){

acc[id]={
id,
title:
msg.content,
createdAt:
msg.createdAt
};

}

return acc;

},
{}
)

).sort(
(a,b)=>
new Date(
b.createdAt
)
-
new Date(
a.createdAt
)
);


// CURRENT CHAT

const current=
history.filter(

m=>

selectedConversationId

?

m.conversationId===
selectedConversationId

:

false

);


// SEND MESSAGE

const explain=
async()=>{

if(
loading
||
!text.trim()
)
return;

setLoading(
true
);

setStatus(
"Generating..."
);

const question=
text.trim();

setText("");

let conversationId=
selectedConversationId;


// create only if none selected

if(
!conversationId
){

conversationId=
crypto
.lib.WordArray
.random(16)
.toString();

setSelectedConversationId(
conversationId
);

}

try{

await fetch(
`${API_BASE}/explain`,
{

method:
"POST",

headers:{
"Content-Type":
"application/json"
},

body:
JSON.stringify({

text:
question,

userId:
userData.userId,

email:
userData.signInDetails
.loginId,

conversationId

})

}

);


// poll

let attempts=0;

const interval=
setInterval(

async()=>{

attempts++;

const res=
await fetch(
`${API_BASE}/history?userId=${userData.userId}`
);

const rows=
await res.json();

rows.sort(
(a,b)=>
new Date(
a.createdAt
)
-
new Date(
b.createdAt
)
);

setHistory(
rows);


// assistant exists?

const assistant=
rows.filter(

m=>

m.conversationId===
conversationId

&&

m.role===
"assistant"

);

const user=
rows.filter(

m=>

m.conversationId===
conversationId

&&

m.role===
"user"

);


// stop when pairs complete

if(
assistant.length
>=
user.length
){

clearInterval(
interval
);

setLoading(
false
);

setStatus(
"");

}


// timeout

if(
attempts>
30
){

clearInterval(
interval
);

setLoading(
false
);

setStatus(
"Timeout"
);

}

},
2000
);

}
catch(e){

console.log(
e
);

setLoading(
false
);

setStatus(
"Failed"
);

}

};


// NEW CHAT

const newChat=
()=>{

setSelectedConversationId(
null
);

setStatus("");

setText("");

};


// SIGN OUT

const logout=
()=>{

localStorage.clear();

window.location.reload();

};


return(

<div className="app">

<div className="sidebar">

<h2>
Conversations
</h2>

<button
onClick={
newChat
}
>

+ New Chat

</button>


{

conversations.map(

c=>

<div

key={
c.id
}

className={
selectedConversationId===
c.id

?

"conversation active"

:

"conversation"
}

onClick={()=>

setSelectedConversationId(
c.id
)

}

>

<h3>

{c.title}

</h3>

<p>

{

new Date(
c.createdAt
)

.toLocaleString()

}

</p>

</div>

)

}

</div>



<div className="chat">

<div className="header">

<h1>

Explain Like I'm 5

</h1>

<p>

{

userData
?.signInDetails
?.loginId

}

</p>

<button
onClick={
logout
}
>

Sign Out

</button>

</div>



<div className="messages">

{

current.map(

(m,i)=>

<div

key={i}

className={

m.role==="user"

?

"user"

:

"assistant"

}

>

<div>

{

m.role==="user"

?

"You"

:

"ELI5 AI"

}

</div>

<p>

{m.content}

</p>

</div>

)

}


{

loading

&&

<div
className=
"assistant"
>

<div>

ELI5 AI

</div>

<p>

Generating response…

</p>

</div>

}

</div>



<div className="input">

<textarea

value={
text
}

onChange={
e=>

setText(
e.target.value
)

}

placeholder=
"Ask something complicated..."

/>

<button

disabled={
loading
}

onClick={
explain
}

>

{

loading

?

"Generating"

:

"Explain"

}

</button>

</div>


{

status

&&

<p>

{status}

</p>

}

</div>

</div>

);

}
