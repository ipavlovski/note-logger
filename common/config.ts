// environment variables
export const serverHost = process.env.SERVER_HOST
export const serverPort = parseInt(process.env.SERVER_PORT!)
export const dbPath = process.env.DB_PATH
export const mediaPath = process.env.MEDIA_PATH

// when does the 'relative day' start (e.g. 5 -> 5am)
export const DAY_OFFSET_HOURS = 5

// regexes to match word-dates (1d,3w,2m,4y,now) and num-dates (2011, 2011-12, 2011-12-14)
export const DATE_REGEX: [RegExp, RegExp] = [/^(\d+)([dwmy])$|^now$/, /^(2\d{3})(-[01]\d(-[0-3]\d)?)?$/]
