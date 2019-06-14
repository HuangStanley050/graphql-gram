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
import {createWriteStream} from "fs";
import User from "../models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const uploadDir = "./uploads";

const storeUpload = async ({createReadStream, filename}, bucket) => {
  const id = "testID";
  const path = `${uploadDir}/${id}-${filename}`;
  const stream = createReadStream();
  const file = bucket.file("my-file");

  return new Promise((resolve, reject) =>
    stream
      .pipe(file.createWriteStream())
      .on("finish", () => resolve({id, path}))
      .on("error", reject)
  );
};

const processUpload = async (upload, bucket) => {
  const {createReadStream, filename, mimetype, encoding} = await upload;
  const {id, path} = await storeUpload({createReadStream, filename}, bucket);
  return path;
};

const mutation = {
  singleUpload: (obj, {file}, {bucket}, info) => {
    processUpload(file, bucket);
  },
  login: async (parent, args, ctx, info) => {
    console.log(ctx.request.headers);
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
        {userId: user.id, email: user.email},
        process.env.SECRET,
        {expiresIn: "1h"}
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
