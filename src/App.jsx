import { useEffect, useMemo, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";

const API_BASE =
"https://tpocns7qc7.execute-api.us-east-1.amazonaws.com/prod";

function App() {

const [text,setText]=useState("");

const [status,setStatus]=useState("");

const [history,setHistory]=useState([]);

const [
selectedConversationId,
setSelectedConversationId
]=useState(null);

const [userData,setUserData]=useState(null);

const [loading,setLoading]=useState(false);

// --------------------

const loadHistory=
async(currentUser)=>{

if(!currentUser?.userId)
return;

try{

const response=
await fetch(
`${API_BASE}/history?userId=${currentUser.userId}`
);

const data=
await response.json();

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

}
catch(err){

console.error(err);

}

};

// --------------------

useEffect(()=>{

if(userData){

loadHistory(
userData
);

}

},[
userData
]);

// --------------------

const conversations=
useMemo(()=>{

const grouped={};

history.forEach(item=>{

if(
!grouped[
item.conversationId
]
){

grouped[
item.conversationId
]=[];

}

grouped[
item.conversationId
].push(item);

});

return Object
.entries(grouped)

.map(
([id,messages])=>{

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

conversationId:id,

title:
first?.content
||
"New Chat",

createdAt:
first?.createdAt,

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

// --------------------

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

// --------------------

const newChat=()=>{

setSelectedConversationId(
null
);

setText("");

setStatus("");

};

// --------------------

const explain=
async()=>{

if(
!text.trim()
||
loading
)
return;

setLoading(
true
);

const question=
text.trim();

setText("");

let conversationId=
selectedConversationId;

if(
!conversationId
){

conversationId=
crypto.randomUUID();

setSelectedConversationId(
conversationId
);

}

const optimistic={

conversationId,

role:
"user",

content:
question,

createdAt:
"pending"
};

setHistory(
prev=>{

const exists=
prev.some(

m=>

m.content===
question &&

m.role===
"user" &&

m.conversationId===
conversationId
);

if(exists)
return prev;

return[
...prev,
optimistic
];

});

setStatus(
"Generating..."
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
question,

userId:
userData.userId,

email:
userData
.signInDetails
.loginId,

conversationId

})

}
);

let attempts=0;

const timer=
setInterval(
async()=>{

attempts++;

const res=
await fetch(
`${API_BASE}/history?userId=${userData.userId}`
);

const latest=
await res.json();

const rows=
Array.isArray(
latest
)
?
latest
:
[];

rows.sort(
(a,b)=>
new Date(a.createdAt)-
new Date(b.createdAt)
);

const hasAnswer=
rows.some(

m=>

m.role===
"assistant" &&

m.conversationId===
conversationId
);

setHistory(
prev=>{

const keep=
prev.filter(
x=>

x.createdAt!==
"pending"
);

const merged=[
...keep,
...rows
];

return merged.filter(
(item,index,self)=>

index===

self.findIndex(
x=>

x.role===
item.role &&

x.content===
item.content &&

x.createdAt===
item.createdAt
)

);

});

if(
hasAnswer
){

clearInterval(
timer
);

setStatus("");

setLoading(
false
);

}

if(
attempts>20
){

clearInterval(
timer
);

setStatus("");

setLoading(
false
);

}

},
2500
);

}
catch(err){

console.error(
err
);

setStatus(
"Failed"
);

setLoading(
false
);

}

};

// --------------------

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
padding:20
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
height:80
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
padding:25,
marginTop:20,
cursor:"pointer",
background:

selectedConversationId===

c.conversationId

?

"#243760"

:

"transparent"
}}
>

<h3>

{
c.title
.slice(
0,
28
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
padding:30
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
}
</p>

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

display:"flex",

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
padding:35,
borderRadius:28,
background:

m.role===
"user"

?

"#3b82f6"

:

"#223257",

marginBottom:20
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
