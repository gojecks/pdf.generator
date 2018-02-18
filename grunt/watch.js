module.exports = {
    app: {
        files: [
            './src/**/**/*.js'
        ],
        tasks: ['clean:dist',
            'concat:dist',
            'uglify:dist',
            'copy:copydist'
        ]
    }
};