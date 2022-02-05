import { RunResult } from 'common/types'
import sqlite3 from 'sqlite3'

export default class SQLite {
    private db: sqlite3.Database

    constructor(filename: string, debug = false) {
        this.db = new sqlite3.Database(filename)
        this.db.run("PRAGMA foreign_keys = ON")
        if (debug) this.db.on('trace', (event) => console.log('TRACE:', event))
    }

    // insert/update/delete
    // return changes/lastId
    async run(q: string, args?: any[]): Promise<RunResult> {
        return new Promise((resolve, reject) => {
            this.db.run(q, args ?? [], function (err) {
                err ? reject(err) : resolve({ changes: this.changes, lastID: this.lastID })
            })
        })
    }

    // select multiple rows
    async all<T>(q: string, args?: any[]): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            this.db.all(q, args ?? [], (err, rows) => err ? reject(err) : resolve(rows))
        })
    }

    // select single row
    async get<T>(q: string, args?: any[]): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.db.get(q, args ?? [], (err, row) => err ? reject(err) : resolve(row))
        })
    }
}
