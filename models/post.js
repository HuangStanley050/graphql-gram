import mongoose from "mongoose";
const Schema = mongoose.Schema;

const postSchema = Schema(
  {
    comments: [
      {
        type: String,
        ref: "Comment"
      }
    ],
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    fileName: {
      type: String,
      required: true
    }
  },
  {timestamps: true}
);

export default mongoose.model("Post", postSchema);
