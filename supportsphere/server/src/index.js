import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, Ticket } from "./models.js";
import { protect } from "./middleware.js";

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5174" }));
app.use(express.json());
app.get("/api/health", (_req,res)=>res.json({status:"ok",app:"SupportSphere API"}));

app.post("/api/auth/register", async (req,res)=>{
  try {
    const {name,email,password}=req.body;
    if(!name||!email||!password||password.length<6) return res.status(400).json({message:"Name, email and password (6+ characters) are required."});
    if(await User.findOne({email})) return res.status(409).json({message:"Email already registered."});
    const user=await User.create({name,email,password:await bcrypt.hash(password,10)});
    const token=jwt.sign({id:user._id,name:user.name},process.env.JWT_SECRET,{expiresIn:"1d"});
    res.status(201).json({token,user:{id:user._id,name:user.name,email:user.email}});
  } catch {res.status(500).json({message:"Could not register user."});}
});
app.post("/api/auth/login",async(req,res)=>{
  const user=await User.findOne({email:req.body.email});
  if(!user||!(await bcrypt.compare(req.body.password||"",user.password))) return res.status(401).json({message:"Invalid email or password."});
  const token=jwt.sign({id:user._id,name:user.name},process.env.JWT_SECRET,{expiresIn:"1d"});
  res.json({token,user:{id:user._id,name:user.name,email:user.email}});
});

app.use("/api",protect);
app.get("/api/tickets",async(req,res)=>{
  const filter={};
  if(req.query.status) filter.status=req.query.status;
  if(req.query.priority) filter.priority=req.query.priority;
  if(req.query.q) filter.$or=[{title:new RegExp(req.query.q,"i")},{customerEmail:new RegExp(req.query.q,"i")},{description:new RegExp(req.query.q,"i")}];
  res.json(await Ticket.find(filter).sort({createdAt:-1}));
});
app.post("/api/tickets",async(req,res)=>{
  try{
    const {title,customerEmail,category,priority,description}=req.body;
    if(!title?.trim()||!customerEmail?.trim()||!description?.trim()) return res.status(400).json({message:"Title, customer email and description are required."});
    const ticket=await Ticket.create({title,customerEmail,category,priority,description});
    res.status(201).json(ticket);
  }catch{res.status(400).json({message:"Invalid ticket data."});}
});
app.patch("/api/tickets/:id/status",async(req,res)=>{
  if(!["Open","In Progress","Resolved"].includes(req.body.status)) return res.status(400).json({message:"Invalid status."});
  const ticket=await Ticket.findByIdAndUpdate(req.params.id,{status:req.body.status},{new:true,runValidators:true});
  if(!ticket)return res.status(404).json({message:"Ticket not found."});
  res.json(ticket);
});
app.post("/api/tickets/:id/comments",async(req,res)=>{
  const message=req.body.message?.trim();
  if(!message)return res.status(400).json({message:"Comment cannot be empty."});
  const ticket=await Ticket.findById(req.params.id);
  if(!ticket)return res.status(404).json({message:"Ticket not found."});
  ticket.comments.push({author:req.user.name,message});
  await ticket.save();
  res.json(ticket);
});
app.delete("/api/tickets/:id",async(req,res)=>{
  const ticket=await Ticket.findByIdAndDelete(req.params.id);
  if(!ticket)return res.status(404).json({message:"Ticket not found."});
  res.json({message:"Ticket deleted."});
});
app.get("/api/dashboard",async(_req,res)=>{
  const tickets=await Ticket.find();
  res.json({
    total:tickets.length,
    open:tickets.filter(t=>t.status==="Open").length,
    inProgress:tickets.filter(t=>t.status==="In Progress").length,
    resolved:tickets.filter(t=>t.status==="Resolved").length,
    highPriority:tickets.filter(t=>t.priority==="High"&&t.status!=="Resolved").length
  });
});
const port=process.env.PORT||5001;
mongoose.connect(process.env.MONGO_URI).then(()=>app.listen(port,()=>console.log(`SupportSphere API running on ${port}`))).catch(err=>{console.error(err.message);process.exit(1);});
