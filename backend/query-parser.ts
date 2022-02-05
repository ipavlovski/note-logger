import { TagQuery } from 'backend/validation'
import { CatQuery, Query, SqlParams } from 'common/types'
import { DateTime, DurationLike } from 'luxon'
import { DATE_REGEX, DAY_OFFSET_HOURS } from 'common/config'

export default function parseQuery(query: Query): SqlParams {

    // main sql statement
    const stmt: string[] = []
    const stmtArgs: any[] = []

    // deermine the 'core' output columns
    // if type == preview, DONT incldue md and html columns
    // if type == full,    DO   include md and html columns
    const type = query.type
    const previewCols = ['item.id', 'item.header', 'item.created',
        'item.updated', 'item.archived', 'item.category_id']
    const cols = (type == 'preview') ?
        previewCols : previewCols.concat(['item.md', 'item.html'])
    stmt.push(`SELECT ${cols.join(', ')} from item`)

    // tag join, if tags are present
    const tagArgs = query.tags != null ? parseTags(query.tags) : null
    const tagJoin = `INNER JOIN item_tag ON item.id = item_tag.item_id 
    INNER JOIN tag ON tag.id = item_tag.tag_id`
    if (tagArgs) stmt.push(tagJoin)

    // add cat statement if cats are present
    if (query.cats) {
        const { q, args } = parseCategories(query.cats)
        stmt.push(q)
        stmtArgs.push(args)
    } else {
        stmt.push('WHERE TRUE')
    }

    if (query.archived != null) {
        stmt.push('AND archived = ?')
        stmtArgs.push(query.archived ? 1 : 0)
    }

    if (query.created != null) {
        const [start, end] = parseDates(query.created)
        stmt.push('AND created BETWEEN ? AND ?')
        stmtArgs.push(start, end)
    }

    if (typeof query.updated !== 'undefined') {
        if (query.updated == null) {
            stmt.push('AND updated = NULL')
        } else {
            const [start, end] = parseDates(query.updated)
            stmt.push('AND updated BETWEEN ? AND ?')
            stmtArgs.push(start, end)
        }
    }

    if (query.search != null) {
        const { q, args } = parseSearch(query.search)
        stmt.push(q)
        stmtArgs.push(args)
    }

    // tags - after all the clauses
    if (tagArgs) {
        stmt.push(tagArgs.q)
        stmtArgs.push(tagArgs.args)
    }

    // pager - at the end
    if (query.pager) {
        const { q, args } = parsePager(query.pager)
        stmt.push(q)
        stmtArgs.push(args)
    }

    return { q: stmt.join(' '), args: stmtArgs.flat() }
}


function parsePager({ size, page }: { size: number, page: number }): SqlParams {
    // LIMIT <count> OFFSET <skip>
    const orderBy = 'ORDER BY item.created DESC'
    size ? `LIMIT ?` : ''
    page ? `OFFSET ?` : ''
    // TODO: add to the array in the end

    return {
        q: '',
        args: []
    }
}

// INNER GROUPS REPRESENT 'AND'
// OUTER GROUPS REPRESENT 'OR'
function parseTags(tags: TagQuery): SqlParams {
    // filter out all tagged items
    if (!tags.map(v => v.length).some(v => v > 0)) {
        return {
            q: `AND item_tag.tag_id = NULL`,
            args: []
        }
    }

    const tagIds = tags.map(outer => outer.map(inner => inner.id))
    var mainArr = tagIds.map(arr => {
        const qmarks = arr.map(_ => '?')
        return {
            q: `COUNT(tag.id IN (${qmarks.join(', ')}) OR NULL) = ?`,
            args: arr.concat(arr.length)
        }
    })
    const Q = mainArr.map(v => v.q).join(' OR ')
    const args = mainArr.map(v => v.args)
    return {
        q: `GROUP BY item.id HAVING ${Q}`,
        args: args.flat()
    }
}


function parseCategories({ rec, term }: CatQuery): SqlParams {
    let q = ''

    const recIds = rec.map(v => v.id)
    const termIds = term.map(v => v.id)
    const recQmarks = rec.map(_ => '?').join(',')
    const termQmarks = term.map(_ => '?').join(',')

    if (term.length == 0 && rec.length == 0) {
        q = `INNER JOIN category ON item.category_id = category.id 
        WHERE category_id = NULL`
    }

    if (term.length > 0 && rec.length == 0) {
        q = `INNER JOIN category ON item.category_id = category.id 
            WHERE category_id IN (${termQmarks})`
    }

    if (term.length == 0 && rec.length > 0) {
        q = `INNER JOIN (WITH RECURSIVE cat_table (cat_id, cat_pid, cat_name) AS (
                SELECT category.* FROM category WHERE id IN (${recQmarks})
                UNION ALL
                SELECT category.* FROM category
                JOIN cat_table ON category.pid = cat_table.cat_id
            ) SELECT * FROM cat_table) as output ON item.category_id = output.cat_id
            WHERE TRUE`
    }

    if (term.length > 0 && rec.length > 0) {
        q = `INNER JOIN (WITH RECURSIVE cat_table (cat_id, cat_pid, cat_name) AS (
                SELECT category.* FROM category WHERE id IN (${recQmarks})
                UNION ALL
                SELECT category.* FROM category
                JOIN cat_table ON category.pid = cat_table.cat_id
            ) SELECT * FROM cat_table UNION
            SELECT category.* FROM category 
            WHERE id IN (${termQmarks})) as output
            ON item.category_id = output.cat_id
            WHERE TRUE`
    }

    return { q: q, args: [recIds, termIds].flat() }
}


function parseSearch({ header, body }: { header?: string | undefined, body?: string | undefined }): SqlParams {
    if (header == null && body == null) {
        return { q: '', args: [] }
    } else if (header != null && body != null) {
        return { q: 'AND (header LIKE ? OR md LIKE ?)', args: [`%${header}%`, `%${body}%`] }
    } else if (header != null) {
        return { q: 'AND header LIKE ?', args: [`%${header}%`] }
    } else {
        // (body != null)
        return { q: 'AND md LIKE ?', args: [`%${body}%`] }
    }
}


// Acceptable date examples:
// imp-end: 2011, 2011-12, 2011-12-14
// exp-range: 2011..2012, 2011-12..2012-03, 2011-12-01..2012-12-14
// rel-range: 2011..now, 2011-01..3w, 2015-12-01..1y
// imp-now: 1d, 3w, 2m, 4y
function parseDates([start, end]: [string, string | null]): [number, number] {

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
