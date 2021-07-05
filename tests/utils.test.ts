import { addStuff, exec } from '../src/utils'

test('addStuff', done => {    
    expect(addStuff(1, 5)).toBe(6)
    done()
})

test('exec', async done => {
    const results = await exec('echo test').then(val => val.stdout)
    console.log(results)
    expect(results).toBe('test\n')
    done()
})