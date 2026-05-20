import {
useEffect,
useMemo,
useState
} from "react";

import {
Authenticator
}
from "@aws-amplify/ui-react";

const API_BASE =
"https://tpocns7qc7.execute-api.us-east-1.amazonaws.com/prod";

function App() {

const [text,setText]=
useState("");

const [status,setStatus]=
useState("");

const [history,setHistory]=
useState([]);

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

// ---------- HISTORY ----------

const loadHistory =
async(user)=>{

if(!user?.userId)
return;

try{

const res=
await fetch(
`${API_BASE}/history?userId=${user.userId}`
);

const data=
await res.json();

const rows=
Array.isArray(data)
?data
:[];

rows.sort(
(a,b)=>
new Date(a.createdAt)-
new Date(b.createdAt)
);

setHistory(rows);

if(
!selectedConversationId &&
rows.length
){

setSelectedConversationId(
rows.at(-1)
.conversationId
);

}

}
catch(err){

console.error(err);

}

};

useEffect(()=>{

if(userData){

loadHistory(
userData
);

}

},[userData]);

// ---------- CONVERSATIONS ----------

const conversations=
useMemo(()=>{

const map={};

history.forEach(m=>{

if(
!map[
m.conversationId
]
){

map[
m.conversationId
]=[];

}

map[
m.conversationId
].push(m);

});

return Object
.values(map)

.map(messages=>{

messages.sort(
(a,b)=>
new Date(a.createdAt)-
new Date(b.createdAt)
);

const first=
messages.find(
m=>
m.role==="user"
);

return{

conversationId:
first
?.conversationId,

title:
first
?.content ||
"New Chat",

createdAt:
first
?.createdAt,

messages

};

})

.sort(
(a,b)=>
new Date(
b.createdAt
)-
new Date(
a.createdAt
)
);

},[
history
]);

// ---------- CHAT ----------

const selectedMessages=
useMemo(()=>{

return history

.filter(
m=>

m.conversationId===

selectedConversationId
)

.sort(
(a,b)=>

new Date(
a.createdAt
)-

new Date(
b.createdAt
)
);

},[
history,
selectedConversationId
]);

// ---------- NEW CHAT ----------

const newChat=()=>{

setSelectedConversationId(
null
);

setText("");

setStatus("");

};

// ---------- EXPLAIN ----------

const explain=
async()=>{

if(
!text.trim() ||
loading
)
return;

setLoading(
true
);

const message=
text.trim();

setText("");

let convo=
selectedConversationId;

if(!convo){

convo=
crypto.randomUUID();

setSelectedConversationId(
convo
);

}

const optimistic={

conversationId:
convo,

role:
"user",

content:
message,

createdAt:
new Date()
.toISOString()
};

setHistory(
prev=>
[
...prev,
optimistic
]
);

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
message,

userId:
userData.userId,

email:
userData
.signInDetails
.loginId,

conversationId:
convo

})

}
);

setStatus(
"Generating..."
);

let attempts=0;

const timer=
setInterval(
async()=>{

attempts++;

await loadHistory(
userData
);

const updated=
history.filter(
m=>

m.conversationId===
convo &&

m.role===
"assistant"
);

if(
updated.length
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
attempts>15
){

clearInterval(
timer
);

setLoading(
false
);

setStatus("");

}

},
2500
);

}
catch(err){

console.error(
err
);

setLoading(
false
);

setStatus(
"Failed."
);

}

};

// ---------- UI ----------

return(

<Authenticator>

{({
user,
signOut
})=>{

if(
!userData &&
user
){

setUserData(
user
);

}

return(

<div
style={{
display:"flex",
height:"100vh",
background:"#020b2d",
color:"white"
}}
>

<div
style={{
width:340,
padding:20,
overflowY:"auto"
}}
>

<h2>
Conversations
</h2>

<button
onClick={
newChat
}
style={{
width:"100%",
height:72
}}
>
+ New Chat
</button>

{
conversations.map(
c=>(

<div

key={
c.conversationId
}

onClick={()=>

setSelectedConversationId(
c.conversationId
)

}

style={{
padding:20,
marginTop:20,
cursor:"pointer",
background:
selectedConversationId===
c.conversationId
?
"#223257"
:
"transparent"
}}
>

<h3>
{
c.title
.slice(
0,
26
)
}
</h3>

<div>

{
new Date(
c.createdAt
)
.toLocaleString()
}

</div>

</div>

))
}

</div>

<div
style={{
flex:1,
display:"flex",
flexDirection:"column"
}}
>

<div
style={{
padding:40
}}
>

<h1>
Explain Like I'm 5
</h1>

<button
onClick={
signOut
}
>
Sign Out
</button>

</div>

<div
style={{
flex:1,
overflow:"auto",
padding:30
}}
>

{
selectedMessages.map(
(m,i)=>(

<div

key={
i
}

style={{

display:
"flex",

justifyContent:

m.role===
"user"

?

"flex-end"

:

"flex-start"

}}

>

<div
style={{
maxWidth:700,
padding:30,
borderRadius:24,
marginBottom:20,
background:

m.role===
"user"

?

"#3b82f6"

:

"#223257"
}}
>

<b>

{
m.role===
"user"

?

"You"

:

"ELI5 AI"
}

</b>

<div>

{
m.content
}

</div>

</div>

</div>

))
}

</div>

<div
style={{
display:"flex",
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

style={{
flex:1
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

"Generating"

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
