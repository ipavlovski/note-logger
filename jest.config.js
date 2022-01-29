module.exports = {
    roots: ["./tests"],
    testMatch: ["**/__tests__/**/*.+(ts|tsx|js)", "**/?(*.)+(spec|test).+(ts|tsx|js)"],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    setupFiles: ["dotenv/config"],
    moduleDirectories: ['node_modules', 'src', '.'],
}

process.env = Object.assign(process.env, {
    SERVER_PORT: '3003'
})