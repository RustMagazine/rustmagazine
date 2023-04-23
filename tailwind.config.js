// Install tailwindcss standalone CLI, see https://tailwindcss.com/blog/standalone-cli.
// Or install node version of tailwindcss.
//
// tailwindcss -o static/footer.css --watch --minify

module.exports = {
    content: [
        './templates/**/*.html',
    ],
    corePlugins: {
        // Disable preflight styles.
        preflight: false,
    },
    plugins: [
    ],
}