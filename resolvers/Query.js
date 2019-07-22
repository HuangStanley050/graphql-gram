import Post from "../models/post";
import Comment from "../models/comment";
import mongoose from "mongoose";
import {checkAuth} from "../middlewares/auth";
import {getToken} from "../middlewares/getToken";

const query = {
  hello: (parent, args, ctx, info) => {
    return "hello";
  },
  ownFiles: async (parent, args, {request, bucket}, info) => {
    let token;
    let decoded;
    const userId = args.data;

    token = getToken(request.headers.authorization);
    decoded = checkAuth(token);
  },
  infinity: async (parent, args, {request, bucket}, info) => {
    //trying to implement infinity scroll when fetching data from client
    //will fetch one post at a time
    //1. Need to find out how many posts there in the database
    //2. Use the page number suppllied by client to fetch the time from google storageBucke
    //3. get corresponidng information from mongodb
    //4. return the response back to client
    //5. need to figure out what to do when we reach the end of the Post
    //if there are 9 posts and then client send page 8 request that means it's no more as 8+1 = 9 total posts
    //send page 0 request then fetch the first item in post[0] so on so forth, last item is post[8]

    //client will keep a current page and total page counter, once current page is one less than total page that means
    //all posts have been downloaded
    let token;
    let decoded;
    let results;
    let file;
    let fileName;
    let totalPages;
    let postId;
    const page = args.data.page;
    token = getToken(request.headers.authorization);
    decoded = checkAuth(token);
    //console.log(page);
    const options = {
      version: "v2", // defaults to 'v2' if missing.
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 // one hour
    };
    try {
      let [files] = await bucket.getFiles();
      totalPages = files.length;
      if (page >= totalPages) {
        throw new Error("No more posts left!!");
      }
      file = files[page];
      fileName = files[page].name;

      let [privateUrl] = await file.getSignedUrl(options);
      postId = await Post.findOne({fileName});
      return {
        postId: postId.id,
        fileName,
        download: privateUrl,
        totalPages
      };
    } catch (err) {
      throw new Error("Unable to perform fetching post");
    }
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
