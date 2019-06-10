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
const uploadDir = "./uploads";

const storeUpload = async ({createReadStream, filename}) => {
  const id = "testID";
  const path = `${uploadDir}/${id}-${filename}`;
  const stream = createReadStream();
  return new Promise((resolve, reject) =>
    stream
      .pipe(createWriteStream(path))
      .on("finish", () => resolve({id, path}))
      .on("error", reject)
  );
};

const processUpload = async upload => {
  const {createReadStream, filename, mimetype, encoding} = await upload;
  const {id, path} = await storeUpload({createReadStream, filename});
  return path;
};

const mutation = {
  singleUpload: (obj, {file}) => {
    console.log("running");
    processUpload(file);
  }
  //multipleUpload: (obj, { files }) => Promise.all(files.map(processUpload))
};

export default mutation;
