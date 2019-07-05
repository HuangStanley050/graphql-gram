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
  allposts: async (parent, args, {request, bucket}, info) => {
    let decoded;

    if (!request.headers.authorization) {
      throw new Error("No auth in header");
    }
    const token = request.headers.authorization.split(" ")[1];
    decoded = checkAuth(token);

    const options = {
      version: "v2", // defaults to 'v2' if missing.
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 // one hour
    };
    // try to get all files in the storageBucket
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

    let results = await Promise.all(downloadSignedUrls).then(files => files);

    if (decoded) {
      return results;
    } else {
      throw new Error("Not authenticated");
    }
  }
};

export default query;
