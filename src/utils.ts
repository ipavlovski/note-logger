import { exec as default_exec } from "child_process"
import { createWriteStream, constants } from 'fs'
import mysql, { ResultSetHeader, RowDataPacket } from "mysql2/promise"
import fetch from 'node-fetch'
import { mysqlConfig, pathVolume } from 'src/config'
import { pipeline } from 'stream'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import { join } from 'path'

// async exec
export const exec = promisify(default_exec)

// async file download
const streamPipeline = promisify(pipeline)
export async function downloadFile(fileUrl: string, filePath: string): Promise<void> {
    await fetch(fileUrl).then(val => streamPipeline(val.body, createWriteStream(filePath)))
}


// storage initializer
export async function initStorage(pathDir: string): Promise<string> {
    let outputPath: string

    // check that the volume exists
    try {
        await fs.access(pathVolume, constants.R_OK | constants.W_OK)
    } catch (err) {
        console.error(err)
        // TODO: quit the module processing
    }

    // create the directory if not exists
    try {
        outputPath = join(pathVolume, pathDir)
        await fs.mkdir(outputPath)
    } catch (err) {
        console.error(err)
        // TODO: quit the module processing
    }

    return outputPath
}

// unit testing
export function addStuff(a: number, b: number) {
    return a + b
}