import { useEffect, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";

const API =
"https://tpocns7qc7.execute-api.us-east-1.amazonaws.com/prod";

function App() {

const [text,setText]=useState("");

const [loading,setLoading]=
useState(false);

const [chat,setChat]=
useState(null);

const [currentUser,
setCurrentUser]=
useState(null);

async function loadHistory(user){

if(!user) return;

try{

const userId =
user.userId ||
user.username ||
user.attributes?.sub;

const res =
await fetch(
`${API}/history?userId=${encodeURIComponent(userId)}`
);

const data =
await res.json();

if(
!Array.isArray(data)
||
data.length===0
){

setChat(null);

return;

}

const sorted =
data.sort(
(a,b)=>

new Date(
b.createdAt
)

-

new Date(
a.createdAt
)

);

const userMsg =
sorted.find(
x=>
x.role==="user"
);

const aiMsg =
sorted.find(
x=>
x.role==="assistant"
);

setChat({

question:
userMsg?.content
||
"",

answer:
aiMsg?.content
||
""

});

}
catch(err){

console.log(err);

setChat(null);

}

}

useEffect(()=>{

if(currentUser){

setChat(null);

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

setLoading(true);

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
text;

setChat({

question,

answer:
"Generating..."

});

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

email

})

}

);

let tries=0;

const poll=
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
poll
);

setLoading(
false
);

}

},
2000
);

setTimeout(()=>{

clearInterval(
poll
);

setLoading(
false
);

},45000);

}
catch(err){

console.log(err);

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

background:
"#020b24",

height:
"100vh",

color:
"white",

display:
"flex",

flexDirection:
"column"

}}
>

<div
style={{

padding:40,

textAlign:
"center"

}}
>

<h1
style={{

fontSize:72

}}
>

Explain Like I'm 5

</h1>

<div>

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

style={{

marginTop:20,

padding:
"15px 30px",

background:
"#ff4f4f",

border:
"none",

color:
"white",

borderRadius:
20

}}

onClick={()=>{

setChat(
null
);

setText(
""
);

setCurrentUser(
null
);

signOut();

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

{chat && (

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

padding:25,

borderRadius:
25,

maxWidth:
500

}}
>

<b>You</b>

<div>

{
chat.question
}

</div>

</div>

</div>

<div
style={{

marginTop:40,

display:
"flex"

}}
>

<div
style={{

background:
"#1c2b4a",

padding:35,

borderRadius:
25,

maxWidth:
700,

lineHeight:
1.8

}}
>

<b>ELI5 AI</b>

<div>

{
chat.answer
}

</div>

</div>

</div>

</>

)}

</div>

<div
style={{

display:
"flex",

padding:30,

gap:20

}}
>

<textarea

value={text}

onChange={(e)=>

setText(
e.target.value
)

}

rows={3}

style={{

flex:1,

background:
"transparent",

border:
"1px solid #333",

color:
"white",

padding:20,

borderRadius:
20

}}

placeholder=
"Ask something..."

/>

<button

onClick={
explain
}

disabled={
loading
}

style={{

width:220,

background:
"#4285f4",

border:
"none",

color:
"white",

borderRadius:
20,

fontSize:
24

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

);

}}

</Authenticator>

);

}

export default App;
