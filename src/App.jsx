import "./App.css";
import { useEffect, useState } from "react";
import {
fetchAuthSession
} from "aws-amplify/auth";

const API =
import.meta.env.VITE_API_URL;

export default function App(){

const [
user,
setUser
]=useState(null);

const [
history,
setHistory
]=useState([]);

const [
selectedConversation,
setSelectedConversation
]=useState(null);

const [
text,
setText
]=useState("");

const [
loading,
setLoading
]=useState(false);

const [
status,
setStatus
]=useState("");



// AUTH

useEffect(()=>{

loadUser();

},[]);


async function loadUser(){

try{

const session=
await fetchAuthSession();

const payload=
session.tokens
?.idToken
?.payload;

if(payload){

const loaded={

userId:
payload.sub,

email:
payload.email

};

setUser(
loaded
);

localStorage.setItem(
"user",
JSON.stringify(
loaded
)
);

return;

}

}
catch(err){

console.log(
"Amplify not ready"
);

}



const cached=
localStorage.getItem(
"user"
);

if(cached){

setUser(
JSON.parse(
cached
)
);

}

}



// HISTORY

useEffect(()=>{

if(
user
){

loadHistory();

}

},[
user
]);


async function loadHistory(){

try{

const res=
await fetch(

`${API}/history?userId=${user.userId}`

);

const rows=
await res.json();

const ordered=
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
ordered
);

}
catch(err){

console.log(
err
);

}

}



// SEND

async function explain(){

if(
loading
||
!text.trim()
||
!user
)
return;

setLoading(
true
);

setStatus(
"Generating..."
);

const question=
text;

setText("");

let conversationId=
selectedConversation;

if(
!conversationId
){

conversationId=
crypto.randomUUID();

setSelectedConversation(
conversationId
);

}

try{

await fetch(

`${API}/explain`,

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
user.userId,

email:
user.email,

conversationId

})

}

);

poll(
conversationId
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



function poll(
conversationId
){

let attempts=0;

const timer=
setInterval(

async()=>{

attempts++;

await loadHistory();

const res=
await fetch(

`${API}/history?userId=${user.userId}`

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
x=>

x.role==="user"
);

const assistants=
convo.filter(
x=>

x.role==="assistant"
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

await loadHistory();

}

if(
attempts>30
){

clearInterval(
timer
);

setLoading(
false
);

setStatus(
"Timed out"
);

}

},

2000

);

}



// CONVERSATIONS

const conversations=

Object.values(

history.reduce(

(acc,m)=>{

if(
!m.conversationId
)
return acc;

if(
!acc[
m.conversationId
]
){

acc[
m.conversationId
]={

id:
m.conversationId,

title:
m.content,

createdAt:
m.createdAt

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



const current=

history.filter(

m=>

m.conversationId===

selectedConversation

);



return(

<div className="app">

<div className="sidebar">

<h2>

Conversations

</h2>


<button

onClick={()=>{

setSelectedConversation(
null
);

}}

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

className="conversation"

onClick={()=>

setSelectedConversation(
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

user?.email

||

"Loading..."

}

</p>


<button

onClick={()=>{

localStorage.clear();

location.reload();

}}

>

Sign Out

</button>



<div className="messages">

{

current.map(

(m,i)=>

<div

key={i}

className={m.role}

>

<b>

{

m.role==="user"

?

"You"

:

"ELI5 AI"

}

</b>

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

||

!user

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
