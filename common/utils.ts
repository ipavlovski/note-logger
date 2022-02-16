import { DATE_REGEX, DAY_OFFSET_HOURS } from 'common/config'
import { DateTime, DurationLike } from 'luxon'

// app.use(json({ reviver: jsonReviver }))
// DateTime.now().toString() -> '2022-01-16T13:37:00.602-04:00'
// DateTime.now().toUTC().toString() -> '2022-01-16T17:37:20.611Z'
// JSON.parse(json, jsonReviver)
export function jsonReviver(key: string, value: any) {
    const isoRegex = /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d{3}([+-]\d{2}:\d{2}|Z)$/
    return typeof value === 'string' && isoRegex.test(value) ? DateTime.fromISO(value) : value
}


export function vanillaReviver(key: string, value: any) {
    return ((key == 'updated' || key == 'created') && typeof value === 'string') ?
        new Date(value) : value
}


// Acceptable date examples:
// imp-end: 2011, 2011-12, 2011-12-14
// exp-range: 2011..2012, 2011-12..2012-03, 2011-12-01..2012-12-14
// rel-range: 2011..now, 2011-01..3w, 2015-12-01..1y
// imp-now: 1d, 3w, 2m, 4y
export function dateParser([start, end]: [string, string | null]): [number, number] {

    const [wordRegex, numRegex] = DATE_REGEX

    const valStart = start.match(wordRegex) || start.match(numRegex)
    const valEnd = (end != null) ? (end.match(wordRegex) || end.match(numRegex)) : true
    if (!(valStart && valEnd)) throw new Error(`Improper format for date input string`)

    const startMatch = start.match(wordRegex)
    const endMatch = (end == null) ? null : end.match(wordRegex)


    // word examples: 1d, 3w, 2m, 4y
    const wordToDuration = (word: string): DurationLike => {
        const match = word.match(wordRegex)
        const offset = parseInt(match![1])
        return match![2] == 'd' ? { day: offset } :
            match![2] == 'w' ? { week: offset } :
                match![2] == 'm' ? { month: offset } :
                    match![2] == 'y' ? { year: offset } :
                        {}
    }

    // split times: 2011, 2011-12, 2011-12-14
    const getDateUnits = (dateTime: string) => {
        // st == split time
        const st = dateTime.split('-').map(v => parseInt(v))

        return st.length == 1 ? { year: st[0] } :
            st.length == 2 ? { year: st[0], month: st[1] } :
                st.length == 3 ? { year: st[0], month: st[1], day: st[2] } :
                    {}
    }

    // when 2nd date is present, the first val is always a number (not work)
    // dont have to check for it in the 3rd clause
    if (end == null && startMatch != null) {
        // implicit back->now: 1d, 3w, 2m, 4y
        const duration = wordToDuration(start)
        const now = DateTime.now().startOf('second')
        const before = now.minus(duration).startOf('day').plus({ hour: DAY_OFFSET_HOURS })
        return [before.toSeconds(), now.toSeconds()]


    } else if (end == null && startMatch == null) {
        // implicit date->endDate: 2011, 2011-12, 2011-12-14
        const dateUnits = getDateUnits(start)
        const dt = DateTime.fromObject(dateUnits)
        const first = dt.plus({ hour: DAY_OFFSET_HOURS })

        const len = Object.keys(dateUnits).length
        const roundTo = len == 1 ? 'year' : len == 2 ? 'month' : len == 3 ? 'day' : 'hour'
        const last = dt.endOf(roundTo).plus({ hour: DAY_OFFSET_HOURS }).startOf('second')

        return [first.toSeconds(), last.toSeconds()]

    } else if (endMatch != null) {
        // explicit date-start to word-end: 2011..now, 2011-01..3w, 2015-12-01..1y
        const dateUnits = getDateUnits(start)
        const dt = DateTime.fromObject(dateUnits)
        const first = dt.plus({ hour: DAY_OFFSET_HOURS })

        const duration = wordToDuration(end!)
        const dt2 = Object.keys(duration).length != 0 ?
            first.plus(duration) : DateTime.now()
        const last = dt2.plus({ hour: DAY_OFFSET_HOURS }).startOf('second')

        return [first.toSeconds(), last.toSeconds()]
    } else {
        // the only remaining option: end present, end is non-match (number)
        // exp-range: 2011..2012, 2011-12..2012-03, 2011-12-01..2012-12-14
        const dateUnitsStart = getDateUnits(start)
        const dtStart = DateTime.fromObject(dateUnitsStart)
        const first = dtStart.plus({ hour: DAY_OFFSET_HOURS })

        const dateUnitsEnd = getDateUnits(end!)
        const dtEnd = DateTime.fromObject(dateUnitsEnd)
        const last = dtEnd.endOf('day').plus({ hour: DAY_OFFSET_HOURS }).startOf('second')

        return [first.toSeconds(), last.toSeconds()]
    }
}
