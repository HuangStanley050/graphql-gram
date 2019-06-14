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
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const uploadDir = "./uploads";
const secretToken = process.env.SECRET;

const storeUpload = async ({ createReadStream, filename }, bucket, token) => {
  const id = "testID";
  const path = `${uploadDir}/${id}-${filename}`;
  const stream = createReadStream();
  const file = bucket.file(filename);

  //save post to database before saving to cloud storageBucket

  return new Promise((resolve, reject) =>
    stream
      .pipe(
        file.createWriteStream({
          metadata: { metadata: { PoserId: token.userId } }
        })
      )
      .on("finish", () => resolve(filename))
      .on("error", reject)
  );
};

const processUpload = async (upload, bucket, token) => {
  const { createReadStream, filename, mimetype, encoding } = await upload;
  const result = await storeUpload(
    { createReadStream, filename },
    bucket,
    token
  );
  const newPost = Post({
    fileName: result,
    userId: token.userId
  });
  let successfulPost = await newPost.save();
  //console.log(successfulPost.id, result);
  return {
    id: successfulPost.id,
    fileName: result,
    path: "test",
    mimetype,
    encoding
  };
};

const checkAuth = token => {
  if (!token || token === "") {
    throw new Error("No token attached!");
  }
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, secretToken);
  } catch (error) {
    throw new Error("token decode failed!!");
  }
  if (!decodedToken) {
    throw new Error("Unable to authenticat with token");
  }
  return decodedToken;
};

const mutation = {
  singleUpload: (obj, { file }, { request, bucket }, info) => {
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
    console.log(ctx.request.headers);
    try {
      const user = await User.findOne({ email: args.data.email });
      if (!user) {
        throw new Error("User Doesn't exits");
      }
      const isEqual = await bcrypt.compare(args.data.password, user.password);

      if (!isEqual) {
        throw new Error("Incorrect password");
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.SECRET,
        { expiresIn: "1h" }
      );

      return {
        userId: user.id,
        token: token,
        tokenExpiration: 1
      };
    } catch (err) {
      console.log(err);
      throw new Error("Something went wrong");
    }
  },
  createUser: async (parent, args, ctx, info) => {
    try {
      let user = await User.findOne({ email: args.data.email });
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
