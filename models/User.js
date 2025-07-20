import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: String,
  googleId: String,
  secret: [String],
});

const User = mongoose.model("User", userSchema);

export default User;
