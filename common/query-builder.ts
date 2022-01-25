import { DateTime, DurationLike } from 'luxon'
import { CatQuery, Query, TagRow } from 'common/types'

export default class QueryBuilder {
    private query: Query

    constructor() {
        this.query = {
            filter: {
                categories: null,
                tags: null,
                date: {
                    created: null,
                    updated: null
                },
                archived: null
            },
            search: {
                header: null,
                body: null
            },
            pager: {
                size: null,
                page: null,
            }
        }
    }


    // Acceptable date examples:
    // imp-end: 2011, 2011-12, 2011-12-14
    // exp-range: 2011..2012, 2011-12..2012-03, 2011-12-01..2012-12-14
    // rel-range: 2011..now, 2011-01..3w, 2015-12-01..1y
    // imp-now: 1d, 3w, 2m, 4y
    protected parseDateTimeQuery(start: string, end?: string): [number, number] {
        // IMPORTANT VAR: when does the 'relative day' start
        const dayOffsetHours = 5

        // regexes to match word-dates (1d,3w,2m,4y,now) and num-dates (2011, 2011-12, 2011-12-14)
        const wordRegex = /^(\d+)([dwmy])$|^now$/
        const numRegex = /^(2\d{3})(-[01]\d(-[0-3]\d)?)?$/

        const valStart = start.match(wordRegex) || start.match(numRegex)
        const valEnd = (end != null) ? (end.match(wordRegex) || end.match(numRegex)) : true
        if (!(valStart && valEnd)) throw new Error(`Improper format for date input string`)

        const startMatch = start.match(wordRegex)
        const endMatch = (end == null) ? null : end.match(wordRegex)


        // word examples: 1d, 3w, 2m, 4y
        const wordToDuration = (word: string): DurationLike => {
            const match = word.match(wordRegex)
            const offset = parseInt(match[1])
            return match[2] == 'd' ? { day: offset } :
                match[2] == 'w' ? { week: offset } :
                    match[2] == 'm' ? { month: offset } :
                        match[2] == 'y' ? { year: offset } :
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
            const before = now.minus(duration).startOf('day').plus({ hour: dayOffsetHours })
            return [before.toSeconds(), now.toSeconds()]


        } else if (end == null && startMatch == null) {
            // implicit date->endDate: 2011, 2011-12, 2011-12-14
            const dateUnits = getDateUnits(start)
            const dt = DateTime.fromObject(dateUnits)
            const first = dt.plus({ hour: dayOffsetHours })

            const len = Object.keys(dateUnits).length
            const roundTo = len == 1 ? 'year' : len == 2 ? 'month' : len == 3 ? 'day' : 'hour'
            const last = dt.endOf(roundTo).plus({ hour: dayOffsetHours }).startOf('second')

            return [first.toSeconds(), last.toSeconds()]

        } else if (endMatch != null) {
            // explicit date-start to word-end: 2011..now, 2011-01..3w, 2015-12-01..1y
            const dateUnits = getDateUnits(start)
            const dt = DateTime.fromObject(dateUnits)
            const first = dt.plus({ hour: dayOffsetHours })

            const duration = wordToDuration(end)
            const dt2 = Object.keys(duration).length != 0 ?
                first.plus(duration) : DateTime.now()
            const last = dt2.plus({ hour: dayOffsetHours }).startOf('second')

            return [first.toSeconds(), last.toSeconds()]
        } else {
            // the only remaining option: end present, end is non-match (number)
            // exp-range: 2011..2012, 2011-12..2012-03, 2011-12-01..2012-12-14
            const dateUnitsStart = getDateUnits(start)
            const dtStart = DateTime.fromObject(dateUnitsStart)
            const first = dtStart.plus({ hour: dayOffsetHours })

            const dateUnitsEnd = getDateUnits(end)
            const dtEnd = DateTime.fromObject(dateUnitsEnd)
            const last = dtEnd.endOf('day').plus({ hour: dayOffsetHours }).startOf('second')

            return [first.toSeconds(), last.toSeconds()]
        }
    }



    created(start: string, end?: string) {
        this.query.filter.date.created = end ?
            this.parseDateTimeQuery(start) : this.parseDateTimeQuery(start, end)
        return this
    }

    updated(start: string, end?: string) {
        this.query.filter.date.updated = end ?
            this.parseDateTimeQuery(start) : this.parseDateTimeQuery(start, end)
        return this
    }

    /**
     * 
     * @param rec recursive ids
     * @param term terminating ids
     * @returns void - side-effect builder function
     */
    categories({ rec, term }: CatQuery) {
        const recIds = rec.map(({ id }) => id)
        const termIds = term.map(({ id }) => id)
        this.query.filter.categories = { rec: recIds, term: termIds }
        return this
    }

    tags(tags: TagRow[][]) {
        if (tags.flat().length == 0) throw new Error('Must provide at least one tag')
        this.query.filter.tags = tags.map(arr => arr.map(v => v.id))
        return this
    }

    search(header: string, body?: string) {
        this.query.search.header = header
        if (body) this.query.search.body = body
        return this
    }

    pager(page: number, size: number) {
        this.query.pager.page = page
        this.query.pager.size = size
        return this
    }

    archived(isArchived: boolean) {
        this.query.filter.archived = isArchived
        return this
    }

    toJSON(): Query {
        return this.query
    }
}