import { useEffect, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";

const API =
"https://tpocns7qc7.execute-api.us-east-1.amazonaws.com/prod";

function App() {

const [text,setText]=
useState("");

const [loading,setLoading]=
useState(false);

const [history,setHistory]=
useState([]);

const [selectedChat,
setSelectedChat]=
useState(null);

const [currentUser,
setCurrentUser]=
useState(null);

async function loadHistory(user){

if(!user) return;

try{

const userId =

user.userId
||
user.username
||
user.attributes?.sub;

const response =
await fetch(
`${API}/history?userId=${encodeURIComponent(userId)}`
);

const data =
await response.json();

if(
!Array.isArray(data)
){

setHistory([]);

return;

}

const grouped={};

data.forEach(item=>{

const id =
item.conversationId
||
"single";

if(
!grouped[id]
){

grouped[id]={

id,

createdAt:
item.createdAt,

question:"",

answer:""

};

}

if(
item.role==="user"
){

grouped[id].question=
item.content;

}

if(
item.role==="assistant"
){

grouped[id].answer=
item.content;

}

});

const conversations =

Object
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

setHistory(
conversations
);

setSelectedChat(prev=>{

if(
prev
){

const updated =

conversations.find(
x=>
x.id===prev.id
);

if(updated)
return updated;

}

return conversations[0]
||
null;

});

}
catch(err){

console.log(err);

}

}

useEffect(()=>{

if(
currentUser
){

setHistory([]);

setSelectedChat(null);

loadHistory(
currentUser
);

}

},[
currentUser
]);

async function explain(){

if(
!text.trim()
||
loading
||
!currentUser
)
return;

setLoading(
true
);

try{

const userId =

currentUser.userId
||
currentUser.username
||
currentUser.attributes?.sub;

const email =

currentUser
.signInDetails
?.loginId

||

currentUser
.attributes
?.email

||

"";

const question =
text.trim();

const conversationId =
crypto.randomUUID();

const optimistic={

id:
conversationId,

createdAt:
new Date()
.toISOString(),

question,

answer:
"Generating..."

};

setHistory(
prev=>
[
optimistic,
...prev
]
);

setSelectedChat(
optimistic
);

setText("");

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

userId,

email,

conversationId

})

}

);

let tries=0;

const poll =
setInterval(
async()=>{

tries++;

await loadHistory(
currentUser
);

if(
tries>20
){

clearInterval(
poll);

setLoading(
false
);

}

},
2000
);

setTimeout(()=>{

clearInterval(
poll);

setLoading(
false
);

},45000);

}
catch(err){

console.log(
err
);

setLoading(
false
);

}

}

return(

<Authenticator>

{({
user,
signOut
})=>{

if(
user
&&
currentUser
?.username
!==user.username
){

setCurrentUser(
user
);

}

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
"white",

fontFamily:
"Arial"

}}
>

{/* SIDEBAR */}

<div
style={{

width:320,

background:
"#031133",

padding:24,

overflowY:
"auto",

borderRight:
"1px solid rgba(255,255,255,.08)"

}}
>

<h2>

Conversations

</h2>

<button

onClick={()=>
setSelectedChat(
null
)
}

style={{

width:
"100%",

padding:
18,

border:
"none",

borderRadius:
20,

background:
"#3067e8",

color:
"white",

fontSize:
20

}}

>

+ New Chat

</button>

<div
style={{
marginTop:20
}}
>

{

history.map(
chat=>(

<div

key={
chat.id
}

onClick={()=>
setSelectedChat(
chat
)
}

style={{

padding:20,

borderRadius:
18,

marginBottom:
12,

cursor:
"pointer",

background:

selectedChat?.id
===

chat.id

?

"#1c2b4a"

:

"transparent"

}}

>

<div
style={{

fontWeight:
"bold"

}}
>

{

chat.question

?.length
>

35

?

chat.question
.slice(
0,
35
)

+"..."

:

chat.question

}

</div>

<div
style={{

opacity:
.5,

fontSize:
12,

marginTop:
10

}}
>

{

new Date(
chat.createdAt
)

.toLocaleString()

}

</div>

</div>

))

}

</div>

</div>

{/* MAIN */}

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
30,

textAlign:
"center",

borderBottom:
"1px solid rgba(255,255,255,.08)"

}}
>

<h1
style={{

fontSize:
72

}}
>

Explain Like I'm 5

</h1>

<div
style={{

opacity:
.6

}}
>

{
user
?.signInDetails
?.loginId

||

user
?.attributes
?.email

}

</div>

<button

onClick={()=>{

setHistory([]);

setSelectedChat(null);

setCurrentUser(null);

signOut();

}}

style={{

marginTop:
20,

background:
"#ff5757",

padding:
"16px 30px",

border:
"none",

borderRadius:
18,

color:
"white"

}}

>

Sign Out

</button>

</div>

<div
style={{

flex:1,

padding:40,

overflow:
"auto"

}}
>

{

selectedChat

&&

<>

<div
style={{

display:
"flex",

justifyContent:
"flex-end"

}}
>

<div
style={{

background:
"#3067e8",

padding:
26,

borderRadius:
24,

maxWidth:
500

}}
>

<div
style={{

opacity:
.7

}}
>

You

</div>

<div>

{
selectedChat.question
}

</div>

</div>

</div>

<div
style={{

marginTop:
40

}}
>

<div
style={{

background:
"#1c2b4a",

padding:
34,

borderRadius:
24,

maxWidth:
800,

lineHeight:
1.8

}}
>

<div
style={{

opacity:
.7

}}
>

ELI5 AI

</div>

<div>

{
selectedChat.answer
}

</div>

</div>

</div>

</>

}

</div>

<div
style={{

padding:
30,

display:
"flex",

gap:
20

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

rows={3}

placeholder=
"Ask something complicated..."

style={{

flex:1,

background:
"transparent",

border:
"1px solid #333",

borderRadius:
20,

color:
"white",

padding:
20

}}

/>

<button

disabled={
loading
}

onClick={
explain
}

style={{

width:
220,

background:
"#4285f4",

border:
"none",

color:
"white",

fontSize:
24,

borderRadius:
20

}}

>

{

loading

?

"Thinking..."

:

"Explain"

}

</button>

</div>

</div>

</div>

);

}}

</Authenticator>

);

}

export default App;
