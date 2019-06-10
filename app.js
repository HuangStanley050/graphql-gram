import { GraphQLServer } from "graphql-yoga";
import { altairExpress } from "altair-express-middleware";
import cors from "cors";
// ... or using `require()`
// const { GraphQLServer } = require('graphql-yoga')

const typeDefs = `
  type Query {
    hello(name: String): String!
  }
`;

const resolvers = {
  Query: {
    hello: (_, { name }) => `Hello ${name || "World"}`
  }
};

const opts = {
  port: 4000,
  cors: {
    credentials: true,
    origin: ["http://localhost:4000"] // your frontend url.
  }
};

const server = new GraphQLServer({ typeDefs, resolvers });
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
