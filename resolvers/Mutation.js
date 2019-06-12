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
//import { Storage } from "@google-cloud/storage";

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
  }
  //multipleUpload: (obj, { files }) => Promise.all(files.map(processUpload))
};

export default mutation;
