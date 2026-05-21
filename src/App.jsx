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


// ---------- RESET ----------

function resetState(){

setText("");

setLoading(false);

setHistory([]);

setSelectedChat(null);

setCurrentUser(null);

}



// ---------- LOAD ----------

async function loadHistory(user){

if(!user)
return;

try{

const userId =

user.userId
||
user.username
||
user.attributes?.sub;

const res =
await fetch(

`${API}/history?userId=${encodeURIComponent(userId)}`

);

const data =
await res.json();

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

setSelectedChat(
conversations[0]
||
null
);

}
catch(err){

console.log(err);

}

}



// ---------- USER ----------

useEffect(()=>{

if(
currentUser
){

setHistory([]);

setSelectedChat(
null
);

loadHistory(
currentUser
);

}

},[
currentUser
]);



// ---------- SEND ----------

async function explain(){

if(
loading
||
!text.trim()
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

const temp={

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
temp,
...prev
]
);

setSelectedChat(
temp
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



// ---------- LOGOUT ----------

async function logout(signOut){

try{

resetState();

localStorage.clear();

sessionStorage.clear();

await signOut();

window.location.replace(
"/"
);

}
catch(err){

console.log(err);

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

resetState();

setCurrentUser(
user
);

}

return(

<div
style={{

display:"flex",

height:"100vh",

background:"#020b24",

color:"white"

}}
>

{/* SIDEBAR */}

<div
style={{

width:320,

background:"#031133",

padding:24,

overflowY:"auto"

}}
>

<h2>

Conversations

</h2>

{

history.map((chat)=>(

<div

key={chat.id}

onClick={()=>
setSelectedChat(chat)
}

style={{

padding:18,

cursor:"pointer",

marginBottom:12,

borderRadius:18,

background:

selectedChat?.id===chat.id

?

"#1c2b4a"

:

"transparent"

}}

>

<div>

{

chat.question

?.slice(
0,
35
)

}

</div>

</div>

))

}

</div>



{/* MAIN */}

<div
style={{

flex:1,

display:"flex",

flexDirection:"column"

}}
>

<div
style={{

padding:30,

textAlign:"center"

}}
>

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

onClick={()=>
logout(
signOut
)
}

style={{

marginTop:20,

padding:"15px 25px",

background:"#ff4f4f",

border:"none",

borderRadius:20,

color:"white"

}}

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

<div
style={{

display:"flex",

justifyContent:"flex-end"

}}
>

<div
style={{

background:"#3067e8",

padding:24,

borderRadius:20

}}
>

<b>

You

</b>

<div>

{
selectedChat.question
}

</div>

</div>

</div>



<div
style={{

marginTop:30

}}
>

<div
style={{

background:"#1c2b4a",

padding:30,

borderRadius:20

}}
>

<b>

ELI5 AI

</b>

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

display:"flex",

gap:20,

padding:30

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

style={{

flex:1,

background:"transparent",

color:"white",

padding:20

}}

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
