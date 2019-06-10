import {GraphQLServer} from "graphql-yoga";
import {altairExpress} from "altair-express-middleware";
import * as admin from "firebase-admin";
import Query from "./resolvers/Query";

const opts = {
  port: 4000,
  cors: {
    credentials: true,
    origin: ["http://localhost:4000"] // your frontend url.
  }
};

const server = new GraphQLServer({
  typeDefs: "./schema.graphql",
  resolvers: {
    Query
  }
});
//server.express.use(cors());
server.express.use(
  "/altair",
  altairExpress({
    endpointURL: "/graphql"
    //subscriptionsEndpoint: `ws://localhost:4000/subscriptions`,
    //initialQuery: `{ getData { id name surname } }`,
  })
);
server.start(opts, () => console.log("Server is running on localhost:4000"));
