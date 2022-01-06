// // The server contains access to

// import lodash, { ObjectChain } from 'lodash'

// import { Low, JSONFile } from 'lowdb'
// type Entry = { posts: string[] }
// new JSONFile<Entry>('/tmp/scratch/db-1.json')


// async function tmp(): Promise<string> {
//     return "lol"
// }
// await tmp()


// declare interface Chainable<T> {
//     value(): T  // This methods is available for any T.

//     // This method is only available for array types, where T matches V[].
//     map<U, V>(this: Chainable<V[]>, mapFn: (v: V) => U): Chainable<U[]>

//     posts: string[] 
// }




// const adapter = new JSONFile<Entry>('/tmp/scratch/db-1.json' as string)
// const db = new Low<Entry>(adapter)

// // TypeScript error 🎉
// db.data.posts.push(1)
// db.data.posts.push("123")



// // // Note: db.data needs to be initialized before lodash.chain is called.
// // db.chain = lodash.chain(db.data)

// // // Instead of db.data, you can now use db.chain if you want to use the powerful API that lodash provides
// // const post = db.chain
// //     .get('posts')
// //     .find({ id: 1 })
// //     .value() // Important: value() needs to be called to execute chain

