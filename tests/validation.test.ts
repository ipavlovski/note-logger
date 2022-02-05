import { InsertItemSchema, QuerySchema, UpdateItemManySchema, UpdateItemOneSchema } from 'backend/validation'
import { InsertItem, Query, UpdateItemMany, UpdateItemOne } from 'common/types'
import { create } from 'superstruct'



describe('QuerySchema', () => {
    test('basic example', () => {
        const query: Query = {
            type: 'preview',
            archived: false
        }
        
        const validated = create(query, QuerySchema)
        expect(validated).toMatchObject(query)
        
    })
})



describe('InsertItemSchema', () => {
    test('basic example', () => {
        const insertItem: InsertItem = {
            header: 'test',
            created: new Date()
        }
        
        const validated = create(insertItem, InsertItemSchema)
        expect(validated).toMatchObject(insertItem)
        
    })
})


describe('UpdateItemOneSchema', () => {
    test('basic example', () => {
        const updateItem: UpdateItemOne = {
            header: 'test',
            created: new Date()
        }
        
        const validated = create(updateItem, UpdateItemOneSchema)
        expect(validated).toMatchObject(updateItem)
        
    })
})


describe('UpdateItemManySchema', () => {
    test('basic example', () => {
        const updateItem: UpdateItemMany = {
            created: new Date()
        }
        
        const validated = create(updateItem, UpdateItemManySchema)
        expect(validated).toStrictEqual(updateItem)
        
    })
})





