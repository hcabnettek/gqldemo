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


const resolvers = {
    Query: {
      channels: async () => {
        console.log('Channel Query')
        const { rows } = await client.query('SELECT id, name FROM channels');
        console.table(rows)
        return rows;
      },
      messages: async () => {
        const { rows } = await client.query('SELECT id, name FROM messages')
        return rows;
      },
      hello: () => 'Hello Ninja!',
    },
    Mutation: {
      addMessage: async (_, { name },  {chrisIsCool}, info) => {
        const text = 'INSERT INTO messages(name) VALUES($1) RETURNING id,name'
        const values = [name]
  
        const result = await client.query(text, values);
        const payload = {
          messageAdded: { ...result.rows[0] }
        }
        pubsub.publish('messageAdded', payload);
        console.log(result.rows[0])
        if (!result || !chrisIsCool) {
          return {
            success: false,
            log: 'failed to add message',
          };
        }
  
        return {
          code: "201",
          success: true,
          log: 'message added',
          message: result.rows[0],
        };
      },
      addChannel: async (_, { name }, {chrisIsCool}, info) => {
        const text = 'INSERT INTO channels(name) VALUES($1) RETURNING id, name'
        const values = [name]
  
        const result = await client.query(text, values);
        const payload = {
          channelAdded: { ...result.rows[0] }
        }
        pubsub.publish('channelAdded', payload);
        console.log(result.rows[0])
        if (!result || !chrisIsCool) {
          return {
            success: false,
            message: 'failed to add channel',
          };
        }
  
        return {
          code: "201",
          success: true,
          log: 'channel added',
          channel: result.rows[0],
        };
      }
    },
    MutationResponse: {
      __resolveType(mutationResponse, context, info){
        return null;
      },
    },
    Subscription: {
      messageAdded: {
        subscribe: withFilter(
          () => pubsub.asyncIterator('messageAdded'),
          (payload, variables) => {
            return true; //payload.channelId === variables.channelId;
          }
        )
      },
      channelAdded: {
        subscribe: () => pubsub.asyncIterator('channelAdded')
      },
      greetings: async function* sayHiIn5Languages() {
        for (const hi of ['Hi', 'Bonjour', 'Hola', 'Ciao', 'Zdravo']) {
          yield { greetings: hi };
        }
      }
    }
};

export default resolvers;