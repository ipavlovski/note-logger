import { ErrorMessage } from 'common/types'
import { StructError } from 'superstruct'


export class ExceptionHandler implements ErrorMessage {
    type: string
    message: string

    constructor(err: unknown) {
        if (err instanceof StructError) {
            this.message = err.message
            this.type = err.type
        } else if (err instanceof DBError) {
            this.type = err.type
            this.message = err.message
        } else {            
            this.message = 'Unknown server error'
            this.type = 'Server Error'
        }   
    }

    toJSON(): ErrorMessage {
        return {
            type: this.type,
            message: this.message
        }
    }
}


export class DBError extends Error {
    message: string
    type: string

    constructor(message: string, errno: number, code: string) {
        super(message)
        this.message = message
        this.type = code
    }
}