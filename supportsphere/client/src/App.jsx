import {useEffect,useState} from "react";
import axios from "axios";
const API="http://localhost:5001/api";
const api=axios.create({baseURL:API});
api.interceptors.request.use(c=>{const t=localStorage.getItem("ss-token");if(t)c.headers.Authorization=`Bearer ${t}`;return c;});

export default function App(){
 const [token,setToken]=useState(localStorage.getItem("ss-token"));
 const [mode,setMode]=useState("login"),[auth,setAuth]=useState({name:"",email:"",password:""});
 const [tickets,setTickets]=useState([]),[stats,setStats]=useState({});
 const [notice,setNotice]=useState(""),[q,setQ]=useState(""),[statusFilter,setStatusFilter]=useState("");
 const [form,setForm]=useState({title:"",customerEmail:"",category:"Technical",priority:"Medium",description:""});
 const [selected,setSelected]=useState(null),[comment,setComment]=useState("");
 async function load(){
  try{const [t,d]=await Promise.all([api.get("/tickets"),api.get("/dashboard")]);setTickets(t.data);setStats(d.data);}
  catch(e){setNotice(e.response?.data?.message||"Unable to load tickets.");}
 }
 useEffect(()=>{if(token)load();},[token]);
 async function authenticate(e){
  e.preventDefault();
  try{const {data}=await axios.post(API+(mode==="login"?"/auth/login":"/auth/register"),auth);localStorage.setItem("ss-token",data.token);setToken(data.token);setNotice("Welcome to SupportSphere.");}
  catch(e){setNotice(e.response?.data?.message||"Authentication failed.");}
 }
 async function createTicket(e){
  e.preventDefault();
  try{await api.post("/tickets",form);setForm({title:"",customerEmail:"",category:"Technical",priority:"Medium",description:""});setNotice("Ticket created.");load();}
  catch(e){setNotice(e.response?.data?.message||"Could not create ticket.");}
 }
 async function changeStatus(id,newStatus){
  try{await api.patch(`/tickets/${id}/status`,{status:newStatus});setNotice("Ticket status updated.");load();if(selected?._id===id)setSelected({...selected,status:newStatus});}
  catch(e){setNotice(e.response?.data?.message||"Status update failed.");}
 }
 async function addComment(e){
  e.preventDefault();
  try{const {data}=await api.post(`/tickets/${selected._id}/comments`,{message:comment});setSelected(data);setComment("");load();}
  catch(e){setNotice(e.response?.data?.message||"Could not add comment.");}
 }
 async function remove(id){
  if(!confirm("Delete this ticket?"))return;
  try{await api.delete(`/tickets/${id}`);setSelected(null);setNotice("Ticket deleted.");load();}
  catch(e){setNotice(e.response?.data?.message||"Delete failed.");}
 }
 if(!token)return <main className="auth"><form className="panel" onSubmit={authenticate}><h1>SupportSphere</h1><p>Customer support workspace</p>
  {mode==="register"&&<input placeholder="Full name" required value={auth.name} onChange={e=>setAuth({...auth,name:e.target.value})}/>}
  <input type="email" placeholder="Email" required value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})}/>
  <input type="password" placeholder="Password (6+ characters)" minLength="6" required value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})}/>
  <button>{mode==="login"?"Login":"Create account"}</button><p>{notice}</p><a onClick={()=>setMode(mode==="login"?"register":"login")}>{mode==="login"?"Create an account":"Already registered? Login"}</a>
 </form></main>;
 const visible=tickets.filter(t=>(!statusFilter||t.status===statusFilter)&&[t.title,t.customerEmail,t.description].join(" ").toLowerCase().includes(q.toLowerCase()));
 return <main className="shell"><header><div><h1>SupportSphere</h1><span>Customer support ticket workspace</span></div><button className="secondary" onClick={()=>{localStorage.removeItem("ss-token");setToken(null);}}>Logout</button></header>
 {notice&&<p className="notice">{notice}</p>}
 <section className="stats">{[["All tickets",stats.total],["Open",stats.open],["In progress",stats.inProgress],["Resolved",stats.resolved],["High priority",stats.highPriority]].map(([k,v])=><article className="stat" key={k}><small>{k}</small><strong>{v??0}</strong></article>)}</section>
 <section className="layout">
  <form className="panel" onSubmit={createTicket}><h2>Create support ticket</h2>
   <input placeholder="Issue title" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
   <input type="email" placeholder="Customer email" required value={form.customerEmail} onChange={e=>setForm({...form,customerEmail:e.target.value})}/>
   <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>Technical</option><option>Billing</option><option>Account</option><option>General</option></select>
   <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select>
   <textarea placeholder="Describe the issue..." required rows="5" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
   <button>Create ticket</button>
  </form>
  <section className="panel"><div className="tablehead"><h2>Tickets</h2><input className="search" placeholder="Search tickets..." value={q} onChange={e=>setQ(e.target.value)}/></div>
   <select className="filter" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="">All statuses</option><option>Open</option><option>In Progress</option><option>Resolved</option></select>
   <div className="ticketlist">{visible.map(t=><article className="ticket" key={t._id} onClick={()=>setSelected(t)}><div><b>{t.title}</b><small>{t.customerEmail} · {t.category}</small></div><div className="tags"><span className={`priority ${t.priority.toLowerCase()}`}>{t.priority}</span><span className="status">{t.status}</span></div></article>)}{!visible.length&&<p>No tickets match your filters.</p>}</div>
  </section>
 </section>
 {selected&&<section className="panel detail"><div className="tablehead"><div><h2>{selected.title}</h2><small>{selected.customerEmail} · {selected.category} · {selected.priority} priority</small></div><button className="secondary" onClick={()=>setSelected(null)}>Close</button></div>
  <p>{selected.description}</p><label>Update status</label><select value={selected.status} onChange={e=>changeStatus(selected._id,e.target.value)}><option>Open</option><option>In Progress</option><option>Resolved</option></select>
  <h3>Conversation</h3>{selected.comments?.map((c,i)=><div className="comment" key={i}><b>{c.author}</b><p>{c.message}</p><small>{new Date(c.createdAt).toLocaleString()}</small></div>)}
  <form onSubmit={addComment} className="commentform"><textarea rows="2" placeholder="Add an internal note or reply..." value={comment} onChange={e=>setComment(e.target.value)} required/><button>Add comment</button></form>
  <button className="danger" onClick={()=>remove(selected._id)}>Delete ticket</button>
 </section>}
 </main>;
}
