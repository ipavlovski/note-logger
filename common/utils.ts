import { DateTime } from 'luxon'

// app.use(json({ reviver: jsonReviver }))
// DateTime.now().toString() -> '2022-01-16T13:37:00.602-04:00'
// DateTime.now().toUTC().toString() -> '2022-01-16T17:37:20.611Z'
// JSON.parse(json, jsonReviver)
function jsonReviver(key: string, value: any) {
    const isoRegex = /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d{3}([+-]\d{2}:\d{2}|Z)$/
    return typeof value === 'string' && isoRegex.test(value) ? DateTime.fromISO(value) : value
}
