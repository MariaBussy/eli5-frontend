import { useEffect, useState } from "react";
import {
  getCurrentUser,
  fetchAuthSession,
  signOut
} from "aws-amplify/auth";

import "./App.css";

const API =
  import.meta.env.VITE_API_URL;

export default function App() {

const [user,setUser]=useState(null);

const [loading,setLoading]=useState(true);

const [sending,setSending]=useState(false);

const [text,setText]=useState("");

const [messages,setMessages]=useState([]);

const [conversations,setConversations]=useState([]);

const [conversationId,setConversationId]=
useState(null);



useEffect(()=>{

initialize();

},[]);



async function initialize(){

try{

const current =
await getCurrentUser();

setUser(current);

await loadConversations(
current.userId
);

}
catch(err){

console.log(
err
);

}
finally{

setLoading(false);

}

}



async function authHeaders(){

const session =
await fetchAuthSession();

const token =
session.tokens?.idToken
?.toString();

if(!token){

throw new Error(
"NOT_AUTHENTICATED"
);

}

return{

Authorization:
token,

"Content-Type":
"application/json"

};

}



async function loadConversations(
userId
){

try{

const headers =
await authHeaders();

const res =
await fetch(

`${API}/history?userId=${userId}`,

{

headers

}

);

const rows =
await res.json();

if(
!Array.isArray(rows)
){

setConversations([]);

return;

}

rows.sort(

(a,b)=>

new Date(
b.createdAt
)

-

new Date(
a.createdAt
)

);

const grouped =
[];

const seen =
new Set();

for(
const row
of rows
){

if(
!seen.has(
row.conversationId
)
){

seen.add(
row.conversationId
);

grouped.push({

id:
row.conversationId,

title:
row.content

});

}

}

setConversations(
grouped
);

}
catch(err){

console.log(
err
);

}

}



async function openConversation(
id
){

try{

setConversationId(
id
);

const headers =
await authHeaders();

const res =
await fetch(

`${API}/history?conversationId=${id}`,

{

headers

}

);

const rows =
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

setMessages(
rows
);

}
catch(err){

console.log(
err
);

}

}



async function send(){

if(
!text.trim()
||
sending
||
!user
){

return;

}

try{

setSending(true);

const headers =
await authHeaders();

const res =
await fetch(

`${API}/send`,

{

method:
"POST",

headers,

body:
JSON.stringify({

text,

userId:
user.userId,

email:
user.signInDetails
?.loginId,

conversationId

})

}

);

const data =
await res.json();

if(
!res.ok
){

throw new Error(
data.error
);

}

setText("");

const id =
data.conversationId
||
conversationId;

await loadConversations(
user.userId
);

if(id){

await new Promise(
r=>

setTimeout(
r,
2000
)

);

await openConversation(
id
);

}

}
catch(err){

console.log(
err
);

alert(
err.message
);

}
finally{

setSending(false);

}

}



function newChat(){

setConversationId(
null
);

setMessages([]);

setText("");

}



async function logout(){

try{

await signOut();

window.location.reload();

}
catch(err){

console.log(
err
);

}

}



if(
loading
){

return(

<div className="loading">

Loading...

</div>

);

}



return(

<div className="app">

<div className="sidebar">

<h1>

Conversations

</h1>

<button
onClick={
newChat
}
>

+ New Chat

</button>

{

conversations.map(

(c)=>(

<div

key={
c.id
}

className="conversation"

onClick={()=>

openConversation(
c.id
)

}

>

{

c.title

}

</div>

)

)

}

</div>



<div className="main">

<h1>

Explain Like I'm 5

</h1>

<div>

{

user
?.signInDetails
?.loginId

}

</div>

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

(m,index)=>(

<div

key={index}

className={

m.role

}

>

<div>

{

m.role==="user"

?

"You"

:

"ELI5"

}

</div>

<div>

{

m.content

}

</div>

</div>

)

)

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

></textarea>

<button

disabled={
sending
}

onClick={
send
}

>

{

sending

?

"Generating..."

:

"Explain"

}

</button>

</div>

</div>

</div>

);

}
