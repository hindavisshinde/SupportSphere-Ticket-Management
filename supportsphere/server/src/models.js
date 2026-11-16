import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  author: { type: String, required: true },
  message: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, lowercase: true, trim: true },
  category: { type: String, enum: ["Technical", "Billing", "Account", "General"], default: "General" },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  status: { type: String, enum: ["Open", "In Progress", "Resolved"], default: "Open" },
  description: { type: String, required: true },
  comments: [commentSchema]
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
export const Ticket = mongoose.model("Ticket", ticketSchema);
