var license = ['MIT License \n\nCopyright (c) [2016] [pdf.generator]\n\n',
    'Permission is hereby granted, free of charge, to any person obtaining a copy\n',
    'of this software and associated documentation files (the "Software"), to deal\n',
    'in the Software without restriction, including without limitation the rights\n',
    'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n',
    'copies of the Software, and to permit persons to whom the Software is\n',
    'furnished to do so, subject to the following conditions:\n\n',
    'The above copyright notice and this permission notice shall be included in all\n',
    'copies or substantial portions of the Software.\n\n',
    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n',
    'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n',
    'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n',
    'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n',
    'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n',
    'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n',
    'SOFTWARE.'
];

module.exports = {
    options: {
        separator: ';',
        mangle: {
            mangleProperties: true,
            reserveDOMCache: true
        },
        compressor: {
            sequences: true,
            dead_code: true,
            conditionals: true,
            booleans: true,
            unused: true,
            if_return: true,
            join_vars: true,
            drop_console: false
        },
        maxLineLen: 500,
        wrap: true,
        sourceMap: true
    },
    dist: {
        options: {
            banner: '\n/**\n@license pdfGeneratorn\nAuthor : Gojecks Joseph\n' + license.join('') + '\nVersion 1.0.0\n**/\n\n',
            footer: ''
        },
        files: {
            './dist/pdf.generator.min.js': ['./dist/pdf.generator.js']
        }
    }
}