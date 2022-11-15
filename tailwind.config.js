// Install tailwindcss standalone CLI, see https://tailwindcss.com/blog/standalone-cli.
// Or install node version of tailwindcss.
//
// tailwindcss -o static/footer.css --watch --minify

module.exports = {
    content: [
        './templates/**/*.html',
    ],
    prefix: 'tw-',
    corePlugins: {
        // Disable preflight styles.
        preflight: false,
    },
    plugins: [
        // A plugin to truncate text to a fixed number of lines.
        require('@tailwindcss/line-clamp'),
    ],
}