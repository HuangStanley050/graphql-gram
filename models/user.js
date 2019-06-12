import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    posts: [
      {
        type: String,
        ref: "Post"
      }
    ],
    comments: [
      {
        type: String,
        ref: "Comment"
      }
    ]
  },
  {timestamps: true}
);

export default mongoose.model("User", userSchema);
