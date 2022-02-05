import { DATE_REGEX } from 'common/config'
import { CatRow, InsertItem, Query, RenameArgs, TagRow, UpdateItemMany, UpdateItemOne, UpdateManyArgs } from 'common/types'
import { array, boolean, coerce, date, Describe, enums, nonempty, nullable, number, object, optional, refine, string, tuple } from 'superstruct'

const CatRowSchema: Describe<CatRow> = object({
    id: nullable(number()),
    pid: nullable(number()),
    name: string()
})

const TagRowSchema: Describe<TagRow> = object({
    id: nullable(number()),
    name: string()
})

const CatQuerySchema: Describe<CatQuery> = object({
    rec: array(CatRowSchema),
    term: array(CatRowSchema)
})

const TagQuerySchema: Describe<TagQuery> = array(
    array(TagRowSchema)
)

const SearchQuerySchema: Describe<{ header?: string, body?: string }> = object({
    header: optional(nonempty(string())),
    body: optional(string())
})

const DateQuerySchema: Describe<[string, string | null]> = refine(tuple([
    string(),
    nullable(string())
]), 'date-query-regex', ([start, end]) => {
    const [wordRegex, numRegex] = DATE_REGEX
    const validStart = wordRegex.test(start) || numRegex.test(start)
    const validEnd = (end != null) ? wordRegex.test(end) || numRegex.test(end) : true
    return validStart && validEnd
})

export const QuerySchema: Describe<Query> = object({
    type: enums(['full', 'preview']),
    created: optional(DateQuerySchema),
    updated: optional(nullable(DateQuerySchema)),
    archived: optional(boolean()),
    cats: optional(nullable(CatQuerySchema)),
    tags: optional(nullable(TagQuerySchema)),
    search: optional(SearchQuerySchema),
    pager: optional(object({ page: number(), size: number() }))
})

export type CatQuery = { rec: CatRow[], term: CatRow[] }
export type TagQuery = TagRow[][]

// const datetime = () => define<DateTime>('datetime', v => DateTime.isDateTime(v))
// const ISODateTime = coerce(datetime(), string(), (val) => DateTime.fromISO(val))

// Should Describe<Item>, but seems like 'superstruct' has a strange bug
// will need to report it later, for now remove the 'Describe' type
export const InsertItemSchema: Describe<InsertItem> = object({
    header: nonempty(string()),
    created: date(),
    body: optional(object({
        md: string(),
        html: string()
    })),
    updated: optional(date()),
    archived: optional(boolean()),
    category: optional(nonempty(array(CatRowSchema))),
    tags: optional(nonempty(array(TagRowSchema)))
})


export const UpdateItemOneSchema: Describe<UpdateItemOne> = object({
    header: optional(nonempty(string())),
    created: optional(date()),
    body: optional(object({
        md: string(),
        html: string()
    })),
    archived: optional(boolean()),
    updated: optional(nullable(date())),
    category: optional(nullable(array(CatRowSchema))),
    tags: optional(nullable(array(TagRowSchema)))
})

export const UpdateItemManySchema: Describe<UpdateItemMany> = object({
    created: optional(date()),
    archived: optional(boolean()),
    updated: optional(nullable(date())),
    category: optional(nullable(array(CatRowSchema))),
    tags: optional(nullable(array(TagRowSchema)))
})

export const UpdateRouteSchema: Describe<UpdateManyArgs> = object({
    ids: nonempty(array(number())),
    item: UpdateItemManySchema,
    op: enums(['add', 'remove', 'replace']),
})

export const IdCoercion: Describe<number> = coerce(number(), string(), (v) => parseInt(v))

export const RenameRouteSchema: Describe<RenameArgs> = object({
    id: number(),
    type: enums(['tag', 'cat']),
    name: nonempty(string())
})


// export const EnvStringSchema: Describe<string> = nonempty(string())
// export const EnvIntegerSchema: Describe<number> = coerce(number(), string(), v => parseInt(v))
