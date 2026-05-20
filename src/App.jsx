import "./App.css";
import { useEffect, useState } from "react";

const API_BASE =
import.meta.env.VITE_API_URL;

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

try{

const raw =
localStorage.getItem(
"user"
);

if(raw){

setUserData(
JSON.parse(raw)
);

}

}
catch(err){

console.log(err);

}

},[]);


// LOAD HISTORY

useEffect(()=>{

if(
userData?.userId
){

loadHistory();

}

},[
userData
]);


const loadHistory=
async()=>{

if(
!userData?.userId
)
return;

try{

const res=
await fetch(
`${API_BASE}/history?userId=${userData.userId}`
);

const rows=
await res.json();

if(
Array.isArray(
rows
)
){

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

}
catch(err){

console.log(err);

}

};


// CONVERSATIONS

const conversations=
Object.values(

history.reduce(

(acc,row)=>{

if(
!row.conversationId
)
return acc;

if(
!acc[
row.conversationId
]
){

acc[
row.conversationId
]={
id:
row.conversationId,

title:
row.content,

createdAt:
row.createdAt
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


// CURRENT

const current=
selectedConversationId

?

history.filter(

x=>

x.conversationId===

selectedConversationId

)

:

[];



// SEND

const explain=
async()=>{

if(
loading
||
!text.trim()
)
return;


// FIX

if(
!userData?.userId
){

setStatus(
"User not loaded"
);

return;

}

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

if(
!conversationId
){

conversationId=
crypto.randomUUID();

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
userData
?.signInDetails
?.loginId

||

"",


conversationId

})

}

);


// WAIT

let tries=0;

const poll=
setInterval(

async()=>{

tries++;

await loadHistory();

const res=
await fetch(
`${API_BASE}/history?userId=${userData.userId}`
);

const rows=
await res.json();

const convo=
rows.filter(

m=>

m.conversationId===

conversationId

);

const users=
convo.filter(
m=>

m.role==="user"
);

const assistants=
convo.filter(
m=>

m.role==="assistant"
);

if(
assistants.length
>=
users.length
){

clearInterval(
poll
);

setLoading(
false
);

setStatus(
""
);

}

if(
tries>
30
){

clearInterval(
poll
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
catch(err){

console.log(
err
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

setText("");

};


// LOGOUT

const logout=
()=>{

localStorage.clear();

location.reload();

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

<h1>

Explain Like I'm 5

</h1>

<p>

{

userData
?.signInDetails
?.loginId

||

""

}

</p>

<button
onClick={
logout
}
>

Sign Out

</button>


<div className="messages">

{

current.map(

(msg,i)=>

<div

key={i}

className={

msg.role==="user"

?

"user"

:

"assistant"

}

>

<strong>

{

msg.role==="user"

?

"You"

:

"ELI5 AI"

}

</strong>

<p>

{msg.content}

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

Generating response...

</div>

}

</div>



<div>

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


<p>

{status}

</p>

</div>

</div>

);

}
