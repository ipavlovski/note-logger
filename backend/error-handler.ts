

export function ErrorHandler(error: unknown) {
    console.log('HANDLING ERROR:')
    console.log(error)

    let msg: string
    if (error instanceof Error) {
        msg = error.message
    } else {
        msg = 'Unknown issue'
    }

    return { msg }
}