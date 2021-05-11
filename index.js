// import uWS from 'uWebSockets.js';
// import { makeBehavior } from 'graphql-ws/lib/use/uWebSockets';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import ws from 'ws'; // yarn add ws
import { useServer } from 'graphql-ws/lib/use/ws';
import { buildSchema } from 'graphql';
import { withFilter } from 'graphql-subscriptions';
import { PostgresPubSub } from "graphql-postgres-subscriptions";
import pg from 'pg';
const { Client } = pg;

import * as dotenv from 'dotenv';
dotenv.config()

const client = new Client({ 
  user: process.env.DBUSER,
  host: process.env.DBHOST,
  database: process.env.DB,
  password: process.env.DBPASSWORD,
  port: process.env.DBPORT
})
await client.connect()

const pubsub = new PostgresPubSub({ client });

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
type Channel {
  id: ID!
  name: String
}

type Message {
 id: ID!
 name: String
}

type Query {
  channels: [Channel] 
  messages: [Message]
  hello: String
}

type Mutation {
  addMessage(id: ID!, name: String!): Message
  addChannel(id: ID!, name: String!): Channel
}

type Subscription {
 messageAdded(channelId: ID!): Message
 greetings: String
 ping: String
}

schema {
 query: Query
 subscription: Subscription
 mutation: Mutation
}
`);

// The roots provide resolvers for each GraphQL operation
const resolvers = {
  Query: {
    channels: async () => {
      console.log('Channel Query')
      try {
        const { rows  } = await client.query('SELECT id, name FROM channels')
        return rows;
      } catch (err) {
        console.error(err.stack)
      }
    },
    messages: async () => {
      console.log('Messages Query')
      try {
        const { rows } = await client.query('SELECT id, name FROM messages')
        return rows;
      } catch (err) {
        console.error(err.stack)
      }
    },
    hello: () => {
      console.log('Hello Query')
      return 'Hello Beverly Hills Ninja!'
    }
  },
  Mutation: {
    addMessage: async (_, args,  {chrisIsCool}, info) => {
      const text = 'INSERT INTO message(id, name) VALUES($1, $2) RETURNING *'
      const values = [5, 'message text']

      const result = await client.query(text, values);
      console.log(result.rows[0])
      if (!result || !chrisIsCool) {
        return {
          success: false,
          message: 'failed to add message',
        };
      }

      return {
        success: true,
        message: 'message added',
        message: result.rows[0],
      };
    },
    addChannel: async (_, args, {chrisIsCool}, info) => {
      const text = 'INSERT INTO channel(id, name) VALUES($1, $2) RETURNING *'
      const values = [5, 'wrestling']

      const result = await client.query(text, values);
      console.log(result.rows[0])
      if (!result || !chrisIsCool) {
        return {
          success: false,
          message: 'failed to add channel',
        };
      }

      return {
        success: true,
        message: 'channel added',
        message: result.rows[0],
      };
    }
  },
  Subscription: {
    greetings: function* sayHiIn5Languages() {
      for (const hi of ['Hi', 'Bonjour', 'Hola', 'Ciao', 'Zdravo']) {
        yield { greetings: hi };
      }
    },
    messageAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('messageAdded'),
        (payload, variables) => {
          return true; //payload.channelId === variables.channelId;
        }
      )
    },
    ping: () => 'pong'
  },
};

/* uWS
  .App()
  .ws(
    '/graphql',
    makeBehavior(
      { schema, roots, context: ({ req }) => ({
        chrisIsCool: true,
        db: await client.connect()
      }) },
    ),
  )
  .listen(8080, (listenSocket) => {
    if (listenSocket) {
      console.log('Listening to port 8080');
    }
  }); */

const app = express();
const apolloServer = new ApolloServer({ schema, resolvers,
  tracing: true, });

  // apply middleware
apolloServer.applyMiddleware({ app });
const PORT = process.env.PORT || 8080
const server = app.listen(PORT, () => {
  // create and use the websocket server
  const wsServer = new ws.Server({
    server,
    path: '/graphql',
  });

  useServer({ schema }, wsServer);
  console.log(`Listening to port ${PORT}`);
});