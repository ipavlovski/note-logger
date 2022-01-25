import { DateTime } from 'luxon'

export function jsonReviver(key: string, value: any) {
    const isoRegex = /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d{3}([+-]\d{2}:\d{2}|Z)$/
    return typeof value === 'string' && isoRegex.test(value) ? DateTime.fromISO(value) : value
}