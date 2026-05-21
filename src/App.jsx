import { useEffect, useMemo, useState } from "react";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";

const API =
"https://tpocns7qc7.execute-api.us-east-1.amazonaws.com/prod";

function ChatApp() {

const {
user,
signOut
}=useAuthenticator();

const [userData,setUserData]=
useState(null);

const [history,setHistory]=
useState([]);

const [
selectedConversationId,
setSelectedConversationId
]=useState(null);

const [text,setText]=
useState("");

const [loading,setLoading]=
useState(false);

const [status,setStatus]=
useState("");



// AUTH

useEffect(()=>{

if(user){

setUserData({

userId:
user.userId,

email:
user.signInDetails
?.loginId

});

}

},[
user
]);



// HISTORY

useEffect(()=>{

if(
userData?.userId
){

loadHistory();

}

},[
userData
]);



async function loadHistory(){

try{

const res=

await fetch(

`${API}/history?userId=${userData.userId}`

);

const rows=
await res.json();

const grouped={};

(rows||[])

.forEach(m=>{

if(
!grouped[
m.conversationId
]
){

grouped[
m.conversationId
]={

id:
m.conversationId,

createdAt:
m.createdAt,

question:"",
answer:
"Generating response..."

};

}

if(
m.role==="user"
){

grouped[
m.conversationId
].question=
m.content;

}

if(
m.role==="assistant"
){

grouped[
m.conversationId
].answer=
m.content;

}

});

const built=

Object
.values(
grouped
)
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

setHistory(
built
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
!userData
)
return;

setLoading(
true
);

const question=
text;

setText("");

let cid=
selectedConversationId;

if(
!cid
){

cid=
crypto.randomUUID();

setSelectedConversationId(
cid
);

}

setHistory(prev=>[

{

id:cid,

question,

answer:
"Generating response...",

createdAt:
new Date()
.toISOString()

},

...prev

]);

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
userData.userId,

email:
userData.email,

conversationId:
cid

})

}

);

poll(
cid
);

}
catch{

setLoading(
false
);

}

}



function poll(cid){

let tries=0;

const timer=

setInterval(

async()=>{

tries++;

await loadHistory();

const current=

history.find(

x=>

x.id===cid

);

if(

current

&&

current.answer

!==

"Generating response..."

){

clearInterval(
timer
);

setLoading(
false
);

}

if(
tries>20
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



const selected=

useMemo(

()=>

history.find(

x=>

x.id===

selectedConversationId

),

[
history,
selectedConversationId
]

);



return(

<div
style={{

display:"flex",

height:"100vh",

background:"#020b24",

color:"white"

}}

>

<div
style={{

width:320,

padding:20

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

c=>

<div

key={
c.id
}

onClick={()=>

setSelectedConversationId(
c.id
)

}

>

<h3>

{c.question}

</h3>

</div>

)

}

</div>



<div
style={{

flex:1,

display:"flex",

flexDirection:"column"

}}

>

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
signOut
}

>

Sign Out

</button>



<div
style={{

flex:1

}}

>

{

selected

&&

<>

<p>

You:
{
selected.question
}

</p>

<p>

ELI5:
{
selected.answer
}

</p>

</>

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

</div>

</div>

);

}



export default function App(){

return(

<Authenticator>

<ChatApp/>

</Authenticator>

);

}
