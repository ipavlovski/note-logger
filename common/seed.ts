// USAGE IN OTHER FILES:
// http://www.petecorey.com/blog/2020/01/01/random-seeds-lodash-and-es6-imports/
// import { shuffle } from 'lodash'
// import 'utils/seed'
// shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])

import seedrandom from "seedrandom"
seedrandom("seed", { global: true })


