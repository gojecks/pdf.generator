
module.exports = {
    copydist: {
        src: ['*'],
        dest: './example/dist/',
        cwd: './dist/',
        expand: true,
        filter: 'isFile'
    }
};
