import { useEffect, useMemo, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";

function App() {

const API_BASE =
"https://tpocns7qc7.execute-api.us-east-1.amazonaws.com/prod";

const [text,setText]=useState("");

const [status,setStatus]=useState("");

const [history,setHistory]=useState([]);

const [
selectedConversationId,
setSelectedConversationId
]=useState(null);

const [
userData,
setUserData
]=useState(null);

const [
loading,
setLoading
]=useState(false);



function generateConversationId(){

return crypto.randomUUID();

}



// ---------- BUILD ----------

function buildConversations(items){

const grouped={};

items.forEach(item=>{

if(!item.conversationId)
return;

if(
!grouped[
item.conversationId
]
){

grouped[
item.conversationId
]={

id:
item.conversationId,

createdAt:
item.createdAt,

question:
"",

answer:
"Generating response..."

};

}

if(
item.role==="user"
){

grouped[
item.conversationId
].question=
item.content;

}

if(
item.role==="assistant"
){

grouped[
item.conversationId
].answer=
item.content;

}

});

return Object
.values(grouped)
.sort(

(a,b)=>

new Date(
b.createdAt
)

-

new Date(
a.createdAt
)

);

}



// ---------- LOAD ----------

async function loadHistory(currentUser){

if(
!currentUser?.userId
)
return;

try{

const res=

await fetch(

`${API_BASE}/history?userId=${currentUser.userId}`

);

const rows=
await res.json();

const safe=

Array.isArray(
rows
)

?

rows

:

[];

const conversations=

buildConversations(
safe
);

setHistory(
conversations
);

}
catch(err){

console.log(
err
);

}

}



useEffect(()=>{

if(
userData
){

loadHistory(
userData
);

}

},[
userData
]);



// ---------- SEND ----------

async function explain(){

if(
loading
||
!text.trim()
||
!userData
)
return;

setLoading(
true
);

const question=
text;

setText("");

let conversationId=
selectedConversationId;

if(
!conversationId
){

conversationId=
generateConversationId();

setSelectedConversationId(
conversationId
);

}

const optimistic={

id:
conversationId,

question,

answer:
"Generating response...",

createdAt:
new Date()
.toISOString()

};

setHistory(prev=>{

const exists=

prev.some(

x=>

x.id===

conversationId

);

if(
exists
)
return prev;

return [

optimistic,

...prev

];

});

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
.signInDetails
?.loginId,

conversationId

})

}

);

poll(
conversationId
);

}
catch{

setStatus(
"Request failed"
);

setLoading(
false
);

}

}



function poll(conversationId){

let tries=0;

const interval=

setInterval(

async()=>{

tries++;

await loadHistory(
userData
);

const res=

await fetch(

`${API_BASE}/history?userId=${userData.userId}`

);

const rows=
await res.json();

const conversations=

buildConversations(
rows
);

const current=

conversations.find(

c=>

c.id===

conversationId

);

if(

current

&&

current.answer

!==

"Generating response..."

){

clearInterval(
interval
);

setLoading(
false
);

setStatus("");

}

if(
tries>20
){

clearInterval(
interval
);

setLoading(
false
);

}

},

2000

);

}



// ---------- USER ----------

useEffect(()=>{

if(
window.__cachedUser
){

setUserData(
window.__cachedUser
);

}

},[]);



const selectedChat=

useMemo(

()=>

history.find(

c=>

c.id===

selectedConversationId

),

[
history,
selectedConversationId
]

);



return(

<Authenticator>

{({

user,

signOut

})=>{

useEffect(()=>{

if(
user
){

window.__cachedUser=
user;

setUserData(
user
);

}

},[
user
]);



return(

<div
style={{

display:
"flex",

height:
"100vh",

background:
"#020b24",

color:
"white"

}}

>

<div
style={{

width:
320,

padding:
20,

background:
"#031133"

}}

>

<h2>

Conversations

</h2>

<button

onClick={()=>

setSelectedConversationId(
null
)

}

>

+ New Chat

</button>


{

history.map(

chat=>

<div

key={
chat.id
}

onClick={()=>

setSelectedConversationId(
chat.id
)

}

style={{

padding:
20,

cursor:
"pointer",

marginTop:
20,

background:

selectedConversationId===

chat.id

?

"#1c2b4a"

:

"transparent"

}}

>

<div>

{

chat.question

||

"Untitled"

}

</div>

</div>

)

}

</div>



<div
style={{

flex:1,

display:
"flex",

flexDirection:
"column"

}}

>

<div
style={{

padding:
30

}}

>

<h1>

Explain Like I'm 5

</h1>

<p>

{

user
?.signInDetails
?.loginId

||

"Loading"

}

</p>

<button

onClick={

async()=>{

await signOut();

window.__cachedUser=
null;

location.reload();

}

}

>

Sign Out

</button>

</div>



<div
style={{

flex:1,

padding:40

}}

>

{

selectedChat

&&

<>

<div>

<b>

You

</b>

<p>

{

selectedChat.question

}

</p>

</div>

<br/>

<div>

<b>

ELI5 AI

</b>

<p>

{

selectedChat.answer

}

</p>

</div>

</>

}

</div>



<div
style={{

padding:20,

display:"flex",

gap:20

}}

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



{status}

</div>

</div>

);

}}

</Authenticator>

);

}

export default App;
