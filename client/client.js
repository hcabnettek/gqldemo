import ws from 'ws'; 
import Crypto from 'crypto'
import { createClient } from 'graphql-ws';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const client = createClient({
  url: 'ws://localhost:8443/graphql',
  webSocketImpl: ws,
  generateID: () =>
    ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (c ^ (Crypto.randomBytes(1)[0] & (15 >> (c / 4)))).toString(16),
    )
});


// query
(async () => {
   const result = new Promise((resolve, reject) => {
     let result;
     client.subscribe(
       {
         query: 'query GetChannels { channels { id, name } }',
       },
       {
         next: (data) => (result = data),
         error: reject,
         complete: () => resolve(result),
       },
     );
    
   });

  result
    .then(({data:{channels}}) => console.table(channels))
    .catch(e => console.log(e))

})();

// // query
// (async () => {
//   const result2 = new Promise((resolve, reject) => {
//     let result2;
//     client.subscribe(
//       {
//         query: 'query GetMessages { messages { id, name } }',
//       },
//       {
//         next: (data) => (result2 = data),
//         error: reject,
//         complete: () => resolve(result2),
//       },
//     );
    
//   });

//   result2
//     .then(({data: {messages}}) => console.table(messages))
//     .catch(e => console.log(e))

// })();

// subscription
(() => {
  
})();