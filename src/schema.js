import { ApolloServer, gql } from 'apollo-server-express';
import { buildSchema } from 'graphql';
// export { resolvers } from './resolvers.js';

// require('dotenv').config()
  
const typeDefs = `
  type Channel {
     id: ID!
     name: String
  }

  type Message {
    id: ID!
    name: String
  }

  interface MutationResponse {
    code: String!
    success: Boolean!
    log: String!
  }

  type AddChannelMutationResponse implements MutationResponse {
    code: String!
    success: Boolean!
    log: String!
    channel: Channel
  }

  type AddMessagelMutationResponse implements MutationResponse {
    code: String!
    success: Boolean!
    log: String!
    message: Message
  }


  type Query {
     channels: [Channel] 
     messages: [Message]
     hello: String
  }

  type Mutation {
    addMessage(name: String!): AddMessagelMutationResponse
    addChannel(name: String!): AddChannelMutationResponse
  }

  type Subscription {
    messageAdded: Message
    channelAdded: Channel
    greetings: String
  }

  schema {
    query: Query
    subscription: Subscription
    mutation: Mutation
  }
`;
//const PORT = process.env.PORT || 3000;
/* const schema = new ApolloServer(
  { typeDefs, 
    resolvers, 
    playground: {
      endpointURL: '/graphql',
      subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`,
    },
    subscriptions:  {
      path: '/subscriptions',
      onConnect: (connectionParams, webSocket, context) => {
        console.log('Client connected');
      },
      onDisconnect: (webSocket, context) => {
        console.log('Client disconnected')
      },
    }
  }); */

export const subscriptions =  {
    path: '/subscriptions',
    onConnect: (connectionParams, webSocket, context) => {
      console.log('Client connected');
    },
    onDisconnect: (webSocket, context) => {
      console.log('Client disconnected')
    },
}

export default typeDefs;