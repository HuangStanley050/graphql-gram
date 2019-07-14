// 1. Validate file metadata.

// 2. Stream file contents into cloud storage:
// https://nodejs.org/api/stream.html

// 3. Record the file upload in your DB.
// const id = await recordFile( … )
//
//source for this to work:
/*=======================source code from Prisma team==============*/
//https://github.com/prisma/graphql-yoga/blob/854e77405e8436abc2ba372a6787cc807d248be2/examples/file-upload/index.ts
//======================================================================//

/*============ the weird issue of stream being deprecated from nodejs =================*/
//https://github.com/apollographql/apollo-server/issues/2105
//===========================================//
//import { createWriteStream } from "fs";
import User from "../models/user";
import Post from "../models/post";
import Comment from "../models/comment";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import {checkAuth} from "../middlewares/auth";
import {getToken} from "../middlewares/getToken";
const uploadDir = "./uploads";

const storeUpload = async ({createReadStream, filename}, bucket, token) => {
  // const id = "testID";
  // const path = `${uploadDir}/${id}-${filename}`;
  const stream = createReadStream();
  const file = bucket.file(filename);
  const options = {
    version: "v2", // defaults to 'v2' if missing.
    action: "read",
    expires: Date.now() + 1000 * 60 * 60 // one hour
  };

  //save post to database before saving to cloud storageBucket

  return new Promise((resolve, reject) =>
    stream
      .pipe(
        file.createWriteStream({
          metadata: {metadata: {PoserId: token.userId}}
        })
      )
      .on("finish", async () => {
        //get the download url and then send it back as a respone
        let [url] = await file.getSignedUrl(options);
        //console.log(url);
        resolve({filename, url});
      })
      .on("error", reject)
  );
};

const processUpload = async (upload, bucket, token) => {
  try {
    let successfulPost;
    let user;

    const {createReadStream, filename, mimetype, encoding} = await upload;

    const {filename: result, url} = await storeUpload(
      {createReadStream, filename},
      bucket,
      token
    );

    const newPost = Post({
      fileName: result,
      userId: token.userId
    });
    successfulPost = await newPost.save();
    user = await User.findById(mongoose.Types.ObjectId(token.userId));
    user.posts.push(successfulPost.id);
    await user.save();

    return {
      id: successfulPost.id,
      fileName: result,
      download: url,
      mimetype,
      encoding
    };
  } catch (err) {
    console.log(err);
    throw new Error("Upload failed");
  }
};

const mutation = {
  deleteComment: async (parent, args, {request}, info) => {
    let decoded;
    let token;
    let postId;
    let userId;
    const commentId = args.data.commentId;
    token = getToken(request.headers.authorization);
    decoded = checkAuth(token);
    if (decoded) {
      try {
        let comment;
        let post;
        let user;
        let userId;
        let postId;

        comment = await Comment.findById(commentId);
        userId = comment.userId;
        postId = comment.postId;
        post = await Post.findById(postId);
        user = await User.findById(userId);

        await Comment.deleteOne({_id: commentId});
        let userComments = user.comments.filter(
          comment => comment !== commentId.toString()
        );
        let postComments = post.comments.filter(
          comment => comment !== commentId.toString()
        );
        user.comments = userComments;
        post.comments = postComments;
        await post.save();
        await user.save();
        return comment;
      } catch (err) {
        throw new Error("Unable to delete comment");
      }
    } else {
      throw new Error("Token is not valid");
    }
  },
  createComment: async (parent, args, {request}, info) => {
    let decoded;
    let token;
    const postId = args.data.postId;
    const comment = args.data.comment;
    const userId = args.data.userId;

    token = getToken(request.headers.authorization);

    decoded = checkAuth(token);
    //console.log(postId, userId, comment);
    if (decoded) {
      try {
        let post = await Post.findById(postId);
        let user = await User.findById(userId);
        let newComment = new Comment({
          userId: userId,
          postId: postId,
          comment: comment,
          userName: user.name
        });

        let result = await newComment.save();
        post.comments.push(result.id);
        user.comments.push(result.id);
        await post.save();
        await user.save();
        return result;
      } catch (err) {
        console.log(err);
        throw new Error("Unable to add comment to post");
      }
    }
  },
  singleUpload: (obj, {file}, {request, bucket}, info) => {
    let decoded;
    if (!request.headers.authorization) {
      throw new Error("No auth in header");
    }
    const token = request.headers.authorization.split(" ")[1];
    decoded = checkAuth(token);
    let fileResult = processUpload(file, bucket, decoded);
    return fileResult;
  },
  login: async (parent, args, ctx, info) => {
    try {
      const user = await User.findOne({email: args.data.email});
      if (!user) {
        throw new Error("User Doesn't exits");
      }
      const isEqual = await bcrypt.compare(args.data.password, user.password);

      if (!isEqual) {
        throw new Error("Incorrect password");
      }

      const token = jwt.sign(
        {userId: user.id, email: user.email, name: user.name},
        process.env.SECRET,
        {expiresIn: "1h"}
      );

      return {
        userId: user.id,
        token: token
      };
    } catch (err) {
      console.log(err);
      throw new Error("Something went wrong");
    }
  },
  createUser: async (parent, args, ctx, info) => {
    try {
      let user = await User.findOne({email: args.data.email});
      if (user) {
        throw new Error("User already exists!!");
        return false;
      }
      let hashPassword = await bcrypt.hash(args.data.password, 12);

      const newUser = new User({
        email: args.data.email,
        name: args.data.name,
        password: hashPassword
      });

      let result = await newUser.save();
      return result;
    } catch (err) {
      console.log(err);
      throw new Error("Something went wrong");
    }
  }
};

export default mutation;
