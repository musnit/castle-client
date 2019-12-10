const { compile } = require('nexe');

compile({
  clean: true,
}).then(() => {
  compile({
    build: true,
    make: ['-j4'],
    input: './src/index.js',
    targets: ['macos'],
    output: 'castle-desktop-node-macos',
    patches: [
      (x, next) => {
        x.code = () => [x.shims.join(''), x.input].join(';');
        return next();
      },
      async (compiler, next) => {
        let code = compiler.code();
        console.log(code);
        await compiler.setFileContentsAsync('lib/_third_party_main.js', code);
        compiler.options.empty = true; // <-- ADDED THIS (hack)
        return next();
      },
    ],
  }).then(() => {
    console.log('success');
  });
});
