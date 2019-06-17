import Post from "../models/post";
const query = {
  hello: (parent, args, ctx, info) => {
    return "hello";
  },
  allposts: (parent, args, ctx, info) => {}
};

export default query;
