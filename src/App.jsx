import "./App.css";
import { useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";

const API_BASE =
import.meta.env.VITE_API_URL;

export default function App() {

const [userData,setUserData]=
useState(null);

const [history,setHistory]=
useState([]);

const [selectedConversationId,
setSelectedConversationId]=
useState(null);

const [text,setText]=
useState("");

const [loading,setLoading]=
useState(false);

const [status,setStatus]=
useState("");



// LOAD USER

useEffect(()=>{

loadUser();

},[]);


async function loadUser(){

try{

const user=
await getCurrentUser();

setUserData({

userId:
user.userId,

email:
user.signInDetails
?.loginId

||

""

});

}
catch(err){

console.log(
"AUTH ERROR",
err
);

}

}



// LOAD HISTORY

useEffect(()=>{

if(
userData
){

loadHistory();

}

},[
userData
]);


async function loadHistory(){

if(
!userData
)
return;

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
catch(err){

console.log(
err
);

}

}



// GROUP

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



// CURRENT CHAT

const current=
selectedConversationId

?

history.filter(

m=>

m.conversationId===

selectedConversationId

)

:

[];



async function explain(){

if(
loading
||
!text.trim()
)
return;

if(
!userData
){

setStatus(
"Loading user..."
);

return;

}

setLoading(
true);

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
userData.email,

conversationId

})

}

);


let tries=0;

const timer=
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
timer
);

setLoading(
false
);

setStatus("");

}

if(
tries>
30
){

clearInterval(
timer
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

}



function newChat(){

setSelectedConversationId(
null
);

setText("");

}



function logout(){

localStorage.clear();

window.location.reload();

}



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

userData?.email

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

<strong>

{

m.role==="user"

?

"You"

:

"ELI5 AI"

}

</strong>

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

Generating response...

</div>

}

</div>



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


<p>

{status}

</p>

</div>

</div>

);

}
