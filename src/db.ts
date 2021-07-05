import mysql, { ResultSetHeader, RowDataPacket } from "mysql2/promise"
import { mysqlConfig } from 'src/config'
import { exec } from 'src/utils'

// db query
export async function dbQuery<T extends ResultSetHeader | RowDataPacket[]>(query: string, args: any[]): Promise<T> {
    let client: mysql.Connection
    let queryResults: T

    try {
        client = await mysql.createConnection(mysqlConfig);
        [queryResults] = await client.query<T>(query, args)
        return queryResults
    }
    catch (error) {
        console.error(error)
        throw error
    }
    finally { client.end() }
}

export async function reloadSQL(inputFile: string): Promise<void> {
    const str = `mysql -h ${mysqlConfig.host} -u ${mysqlConfig.user} -p${mysqlConfig.password} -P ${mysqlConfig.port} < ${inputFile}`
    await exec(str)
}



export async function query<T extends (ResultSetHeader | RowDataPacket[])>(query: string, args: any[]): Promise<T> {
    let client: mysql.Connection

    try {
        client = await mysql.createConnection(mysqlConfig);
        const [queryResults] = await client.query<T>(query, args)
        return queryResults
    }
    catch (err) { 
        console.error(err)
        throw err
    }
    finally { client.end() }
}
