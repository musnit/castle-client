const { compile } = require('nexe');

compile({
  build: true,
  make: ['-j4'],
  input: './src/index.js',
  targets: ['macos'],
  output: 'daemon',
  patches: [
    /*(x, next) => {
      x.code = () => [x.shims.join(''), x.input].join(';');
      return next();
    },*/
    async (compiler, next) => {
      //await compiler.setFileContentsAsync('lib/_third_party_main.js', compiler.code());
      compiler.options.empty = true; // <-- ADDED THIS (hack)
      return next();
    },
  ],
}).then(() => {
  console.log('success');
});
