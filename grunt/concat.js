module.exports = {
    options: {
        separator: '\n\n\n'
    },
    dist: {
        dest: './dist/pdf.generator.js',
        src: [
            './src/core/*.js',
            './src/core.service/*.js'
        ]
    }
};