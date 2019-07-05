import mongoose from "mongoose";
const Schema = mongoose.Schema;

const commentSchema = Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post"
    },
    comment: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);
