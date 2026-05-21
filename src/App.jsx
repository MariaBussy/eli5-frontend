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

const [selected,setSelected]=useState(null);



useEffect(()=>{

boot();

},[]);



async function boot(){

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
"auth",
err
);

}
finally{

setLoading(false);

}

}



async function loadConversations(
userId
){

try{

const session =
await fetchAuthSession();

const token =
session.tokens?.idToken
?.toString();

const res =
await fetch(

`${API}/history?userId=${userId}`,

{

headers:{

Authorization:
token

}

}

);

const rows =
await res.json();

if(
!Array.isArray(rows)
){

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

setSelected(id);

const session =
await fetchAuthSession();

const token =
session.tokens?.idToken
?.toString();

const res =
await fetch(

`${API}/history?conversationId=${id}`,

{

headers:{

Authorization:
token

}

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

setSending(
true
);

try{

const session =
await fetchAuthSession();

const token =
session.tokens?.idToken
?.toString();

const res =
await fetch(

`${API}/send`,

{

method:
"POST",

headers:{

Authorization:
token,

"Content-Type":
"application/json"

},

body:
JSON.stringify({

text,

userId:
user.userId,

email:
user.signInDetails
?.loginId,

conversationId:
selected

})

}

);

const data =
await res.json();

setText("");

const id =
data.conversationId
||
selected;

await loadConversations(
user.userId
);

await openConversation(
id
);

}
catch(err){

console.log(
err
);

}
finally{

setSending(
false
);

}

}



async function newChat(){

setSelected(
null
);

setMessages(
[]
);

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

<div className="center">

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

key={c.id}

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

<div
className="chat"
>

{

messages.map(

(m,i)=>(

<div

key={i}

className={

m.role

}

>

<strong>

{

m.role==="user"

?

"You"

:

"ELI5"

}

</strong>

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

<div
className="input"
>

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

onClick={
send
}

disabled={
sending
}

>

{

sending

?

"Generating"

:

"Explain"

}

</button>

</div>

</div>

</div>

);

}
