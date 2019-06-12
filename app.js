import {GraphQLServer} from "graphql-yoga";
import {altairExpress} from "altair-express-middleware";
import * as admin from "firebase-admin";
import Query from "./resolvers/Query";
import Mutation from "./resolvers/Mutation";
import serviceAccount from "./graphql-gram-94075-firebase-adminsdk-ejim3-44c474bfe5.json";

const opts = {
  port: 4000,
  cors: {
    credentials: true,
    origin: ["*"] // your frontend url.
  }
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://dining-out-94075.appspot.com/"
});

const bucket = admin.storage().bucket();

const server = new GraphQLServer({
  typeDefs: "./schema.graphql",
  resolvers: {
    Query,
    Mutation
  },
  context: {bucket}
});

server.express.use(
  "/altair",
  altairExpress({
    endpointURL: "/graphql"
  })
);

server.start(opts, () => console.log("Server is running on localhost:4000"));
