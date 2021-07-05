export class Book {

}

export class Category {
    
}

export class Tag {

}



// associated raw output
interface RawBook extends RowDataPacket {
    id: number
    name: string
    author: string
    description: string | null
    category_id: string | null
    tag: string
    category: null
}

// associated final outut
export interface Book {
    id: number
    name: string
    author: string
    description: string | null
    category: string | null
    tags: string[] | null
}

export async function queryBooks() {

    let client: mysql.Connection
    let books: Book[]

    // raw query
    var query = `select book.*, tag.name as tag, category.name as category
        from book_tag
        right join tag on book_tag.tag_id = tag.id
        right join book on book_tag.book_id = book.id
        left join category on book.category_id = category.id;`

    try {
        // get the client
        client = await mysql.createConnection(mysqlConfig)

        // query, with casting and formatting
        books = await client.query<RawBook[]>(query)
            .then(([ val ]) => {
                return groups(val, d => d.id).map(([ _, arr ]) => {
                    const tags: string[] = arr.map(({ tag }) => tag)
                    const { tag, category_id, ...rest } = arr[ 0 ]
                    return { ...rest, tags }
                })
            })
    }
    catch (err) { console.error(err) }
    finally { client.end() }

    return books
}
