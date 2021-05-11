import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import cors from 'cors';
import ws from 'ws'; 
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from 'graphql-tools';
import * as dotenv from 'dotenv';
dotenv.config()

import typeDefs from './src/schema.js';
import resolvers from './src/resolvers.js';

const executableSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

const PORT = process.env.PORT || 3000;
const app = express();

app.use('*', cors({ origin: `http://localhost:${PORT}` }));
const apolloServer = new ApolloServer({ 
  schema: executableSchema,
  tracing: true,
  playground: {
    endpointURL: '/graphql',
    // subscriptionsEndpoint: `wss://localhost:${PORT}/graphql`,
  },
  context: ({req}) => ({chrisIsCool: true})
});

apolloServer.applyMiddleware({app});

const server = app.listen(PORT, () => {
  // create and use the websocket server
  console.log(`🚀 Apollo Server ready at http://localhost:${PORT}`);

  const wsServer = new ws.Server({
    server,
    path: '/graphql',
  });

  useServer({ 
    schema: executableSchema,
    onConnect: (ctx) => {
      // console.log('Connect', ctx);
    },
    onSubscribe: (_, msg) => {
      console.log('Subscribe', msg);
    },
    onNext: (_, {payload}, __, { data }) => {
      console.debug('Next', { payload, data });
    },
    onError: (ctx, msg, errors) => {
      console.error('Error', { ctx, msg, errors });
    },
    onComplete: (ctx, msg) => {
      console.log('Complete');
    },
  }, wsServer);
});

/* // The `listen` method launches a web server.
ws.listen(PORT, () => { 
  console.log(`🚀 Apollo Server ready at http://localhost:${PORT}`);

  new SubscriptionServer({
    execute,
    subscribe,
    schema
  }, {
    server: ws,
    path: '/subscriptions'})
}); */
