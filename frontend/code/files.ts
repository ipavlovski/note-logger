import { execSync as sh } from 'child_process'

function getMarkdownFiles(dirs: string, regex: RegExp): string[] {
    return sh(`ls ${dirs}`).toString().trim().
        split(/\n/).filter((v: string) => regex.test(v))
}

// get the hash-based two-line output
function getHeaders(file: string): string[] {
    let output: string[]
    try {
        const command = `grep -n -A1 --no-group-separator '^# .*$' ${file}`
        output = sh(command).toString().trim().split('\n')
    } catch (error) {
        output = []
    }
    return output
}

// filter out all that follow the hash/::: pattern
function parseHeaders(headers: string[]): number[] {
    const output: number[] = []
    for (let ind = 0; ind < headers.length; ind++) {
        // check if 2 consecutive lines follow a 'hash' and 'triple-dot' pattern
        const line1 = headers[ind]?.match(/\d+:# /)
        const line2 = headers[ind + 1]?.match(/:::$/)
    
        // if both of them do, extract a segment, and check for 'closure' of triple-dot
        if (line1 && line2) {
            const linum = parseInt(headers[ind].match(/^\d+/)[0])
            output.push(linum)
        }
    }
    return output
}


// using a linenumber which indicates successful header+metablock, try to find enclosing block
function extractMeta(linum: number, file: string): { start: number, end: number, text: string[] } {
    // extract the section starting from header, and do 7 lines (::: + 5 + :::)
    const command = `sed -n ${linum},${linum + 8}p ${file}`
    const output = sh(command).toString().trim().split('\n')
    
    for (let ind = 2; ind < output.length; ind++) {
        // if a new header is there, exit with null
        if (output[ind].match(/^# /)) return null
    
        // if a closing header is found, break out with index
        const match = output[ind].match(/:::$/)
        if (match) return { start: linum, end: linum + ind, text: output.slice(0, ind+1) }
    }    

    return null
}


function parseFile(file: string) {

    var headers = getHeaders(file)
    var linums = parseHeaders(headers)
    var metas = linums.map(linum => extractMeta(linum, file)).filter(v => v)
    const output = []

    for (let ind = 0; ind < metas.length; ind++) {
        const meta = metas[ind]
        let start: number, end: number

        if (ind == metas.length - 1) {
            var lastLine = parseInt(sh(`sed -n '$=' ${file}`).toString().trim())

            start = meta.end + 1
            end = lastLine
        } else {
            // content start is line after this elements meta
            // the end of content is the line before the next meta's start
            start = meta.end + 1
            end = metas[ind + 1].start - 1
        }

        // if there is nothing after the meta block
        // or if another starts right away
        // nullify the start/end
        if (end <= start) {
            start = null
            end = null
        }

        output.push({ file: file, meta: meta, content: { start: start, end: end } })
    }

    return output
}

export { parseFile, getMarkdownFiles }