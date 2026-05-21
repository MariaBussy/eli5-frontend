import "./App.css";
import { useEffect, useState } from "react";
import { fetchAuthSession, signOut } from "aws-amplify/auth";

const API =
import.meta.env.VITE_API_URL;

export default function App() {

const [user,setUser]=useState(null);

const [text,setText]=useState("");

const [history,setHistory]=useState([]);

const [selectedConversation,
setSelectedConversation]=useState(null);

const [loading,setLoading]=useState(false);



// ---------- USER ----------

useEffect(()=>{

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

loadAuth();

},[]);



async function loadAuth(){

try{

const timeout=
new Promise((_,reject)=>

setTimeout(

()=>reject(),

3000

)

);

const session=

await Promise.race([

fetchAuthSession(),

timeout

]);

const payload=

session
?.tokens
?.idToken
?.payload;

if(payload){

const u={

userId:
payload.sub,

email:
payload.email

};

setUser(
u
);

localStorage.setItem(

"user",

JSON.stringify(
u
)

);

}

}
catch{

console.log(
"Using cached user"
);

}

}



// ---------- LOAD ----------

useEffect(()=>{

if(
user?.userId
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

(rows||[])

.sort(

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
catch(e){

console.log(
e
);

}

}



// ---------- SEND ----------

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

const question=
text;

setText("");

let conversationId=
selectedConversation;

if(!conversationId){

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

waitForAnswer(
conversationId
);

}
catch{

setLoading(
false
);

}

}



function waitForAnswer(
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

x=>

x.conversationId===

conversationId

);

const users=

convo.filter(
x=>

x.role==="user"
);

const answers=

convo.filter(
x=>

x.role==="assistant"
);

if(

answers.length

>=

users.length

){

clearInterval(
timer
);

setLoading(
false
);

await loadHistory();

}

if(
attempts>20
){

clearInterval(
timer
);

setLoading(
false
);

}

},

2000

);

}



// ---------- SIGN OUT ----------

async function logout(){

try{

await signOut();

}
catch{}

localStorage.clear();

location.reload();

}



// ---------- UI ----------

const conversations=

Object.values(

history.reduce(

(acc,item)=>{

if(
!item.conversationId
)
return acc;

if(
!acc[
item.conversationId
]
){

acc[
item.conversationId
]={

id:
item.conversationId,

title:
item.content,

createdAt:
item.createdAt

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



const messages=

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

onClick={()=>

setSelectedConversation(
null
)

}

>

+ New Chat

</button>

{

conversations.map(

c=>

<div

key={c.id}

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

"Anonymous"

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

messages.map(

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

loading &&

<div
className="assistant"
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

</div>

</div>

);

}
