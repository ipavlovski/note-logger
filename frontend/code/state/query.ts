// QUERY
// representation of the query string
// can have 3 props: query-name, query-loic, query-implementation

export class Query {

    toUrlParams(): string {
        return ""
    }
    q: string

    constructor(q: string) {
        this.q = q
    }


}
