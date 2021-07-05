import { ConnectionOptions } from "mysql2/promise"

export const serverPort = process.env.SERVER_PORT 

export const mysqlConfig: ConnectionOptions = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
    port: parseInt(process.env.MYSQL_PORT)
}

export const pathVolume = process.env.PATH_VOLUME
export const pathData = process.env.PATH_DATA
