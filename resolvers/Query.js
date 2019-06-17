import Post from "../models/post";
import {checkAuth} from "../middlewares/auth";

const query = {
  hello: (parent, args, ctx, info) => {
    return "hello";
  },
  singlePost: async (parent, args, {request}, info) => {
    let decoded;
    let postId = args.postId;
    if (!request.headers.authorization) {
      throw new Error("No auth in header");
    }
    const token = request.headers.authorization.split(" ")[1];
    decoded = checkAuth(token);
    if (decoded) {
      let post = await Post.findById(postId);
      return post;
    }
  },
  allposts: async (parent, args, {request}, info) => {
    let decoded;
    if (!request.headers.authorization) {
      throw new Error("No auth in header");
    }
    const token = request.headers.authorization.split(" ")[1];
    decoded = checkAuth(token);
    if (decoded) {
      let posts = await Post.find({});
      return posts;
    } else {
      throw new Error("Not authenticated");
    }
  }
};

export default query;
