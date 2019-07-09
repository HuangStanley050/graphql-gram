import Post from "../models/post";
import Comment from "../models/comment";
import mongoose from "mongoose";
import {checkAuth} from "../middlewares/auth";
import {getToken} from "../middlewares/getToken";

const query = {
  hello: (parent, args, ctx, info) => {
    return "hello";
  },
  comments: async (parent, args, {request}, info) => {
    let decoded;
    let postId = args.postId;
    let token;
    let comments = [];

    token = getToken(request.headers.authorization);
    decoded = checkAuth(token);
    if (decoded) {
      try {
        let post = await Post.findById(postId);

        post.comments.forEach(id => {
          let comment = Comment.findById(mongoose.Types.ObjectId(id));

          comments.push(comment);
        });

        let finalResult = await Promise.all(comments);
        //console.log(finalResult);
        return finalResult;
      } catch (err) {
        console.log(err);
        throw new Error("Unable to get comments");
      }
    } else {
      throw new Error("Token is not valid");
    }
  },
  singlePost: async (parent, args, {request}, info) => {
    let decoded;
    let postId = args.postId;
    let token;
    token = getToken(request.headers.authorization);
    // if (!request.headers.authorization) {
    //   throw new Error("No auth in header");
    // }
    // const token = request.headers.authorization.split(" ")[1];
    decoded = checkAuth(token);
    if (decoded) {
      let post = await Post.findById(postId);
      return post;
    }
  },
  allposts: async (parent, args, {request, bucket}, info) => {
    let token;
    let decoded;
    let results;
    token = getToken(request.headers.authorization);
    decoded = checkAuth(token);

    const options = {
      version: "v2", // defaults to 'v2' if missing.
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 // one hour
    };
    // try to get all files in the storageBucket

    try {
      let [files] = await bucket.getFiles();

      let downloadSignedUrls = [];

      downloadSignedUrls = files.map(async file => {
        let [privateUrl] = await file.getSignedUrl(options);
        let mongoId = await Post.findOne({fileName: file.name});

        return {
          postId: mongoId.id,
          fileName: file.name,
          download: privateUrl
        };
      });

      results = await Promise.all(downloadSignedUrls).then(files => files);
    } catch (err) {
      console.log(err);
      throw new Error("Unable to fetch posts");
    }

    if (decoded) {
      return results;
    } else {
      throw new Error("Not authenticated");
    }
  }
};

export default query;
