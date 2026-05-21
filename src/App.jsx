import { useEffect, useState } from "react";
import {
  getCurrentUser,
  fetchAuthSession,
  signOut
} from "aws-amplify/auth";

const API =
  import.meta.env.VITE_API_URL;

export default function App() {

const [user,setUser]=useState(null);

const [text,setText]=useState("");

const [messages,setMessages]=useState([]);

const [conversations,setConversations]=useState([]);

const [conversationId,setConversationId]=
useState(null);

const [loading,setLoading]=
useState(false);



useEffect(()=>{

loadUser();

},[]);



async function loadUser(){

try{

const current=
await getCurrentUser();

setUser(current);

loadConversations(
current.userId
);

}
catch{

setUser(null);

}

}



async function loadConversations(
userId
){

try{

const session=
await fetchAuthSession();

const token=
session.tokens?.idToken?.toString();

const res=
await fetch(

`${API}/history?userId=${userId}`,

{

headers:{

Authorization:
token

}

}

);

const data=
await res.json();

const grouped=
Object.values(

data.reduce(
(acc,item)=>{

if(
!acc[
item.conversationId
]
){

acc[
item.conversationId
]=[];

}

acc[
item.conversationId
]
.push(item);

return acc;

},

{}
)

);

grouped.sort(

(a,b)=>

new Date(
b[0].createdAt
)

-

new Date(
a[0].createdAt
)

);

setConversations(
grouped
);

}
catch(err){

console.log(err);

}

}



async function loadConversation(
id
){

try{

const session=
await fetchAuthSession();

const token=
session.tokens?.idToken?.toString();

const res=
await fetch(

`${API}/history?conversationId=${id}`,

{

headers:{

Authorization:
token

}

}

);

const data=
await res.json();

data.sort(

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
data
);

setConversationId(
id
);

}
catch(err){

console.log(err);

}

}



async function send(){

if(
!text.trim()
||
loading
||
!user
){

return;

}

setLoading(
true
);

try{

const session=
await fetchAuthSession();

const token=
session.tokens?.idToken?.toString();

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

conversationId

})

}

);

setText("");

setTimeout(

async()=>{

await loadConversations(
user.userId
);

if(
conversationId
){

await loadConversation(
conversationId
);

}

setLoading(
false
);

},

3000

);

}
catch(err){

console.log(err);

setLoading(
false
);

}

}



async function newChat(){

setMessages([]);

setConversationId(
null
);

}



async function logout(){

await signOut();

location.reload();

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
c[0]
.conversationId
}

className="conv"

onClick={()=>

loadConversation(
c[0]
.conversationId
)

}

>

{

c.find(
x=>

x.role==="user"

)

?.content

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

<p>

{
user
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

<div className="chat">

{

messages.map(

(msg,i)=>(

<div

key={i}

className={

msg.role===

"user"

?

"user"

:

"assistant"

}

>

<div>

{

msg.role===

"user"

?

"You"

:

"ELI5"

}

</div>

<div>

{

msg.content

}

</div>

</div>

)

)

}

</div>

<textarea

value={
text
}

onChange={
(e)=>

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
send
}

>

{

loading

?

"Generating..."

:

"Explain"

}

</button>

</div>

</div>

);

}
