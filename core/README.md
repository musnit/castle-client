# Castle Core ⚙️

Welcome to the new Castle core! This project hopes to be a cross-platform
implementation of Castle's gameplay engine that can be used on web and mobile.
For now the project is starting with a focus on getting web working.

## Directory structure

- **src/**: The C++ core code
- **web/**: A simple web harness with a canvas and a launcher for the core WASM
- **vendor/**: External libraries we depend on, usually as Git submodules
- **assets/**: Static assets for Emscripten to embed into the WASM binary
- **build/**: (ignored in Git) Build output from Emscripten, including the generated WASM binary

## Building and running

### Web

First, make sure all submodules are initialized with `git submodule update
--init --recursive`. Then, the first time you ever build for web, you will need
to run `./run.sh web-init` once to get Emscripten (our C++ web build toolchain)
setup. This may take a little bit.

Next, run `./run.sh web-release` to build a release version of core for the
web. This will again take a bit the very first time (Emscripten fetches and
caches SDL2). Later builds should (hopefully!) be faster.

Finally, run `./run.sh web-serve-release` to serve core as a website to
http://localhost:8080. Open that URL with a browser to check it out!

As a bonus, instead of invoking `./run.sh web-release` repeatedly you can use
`./run.sh web-watch-release` to start a file watcher that will launch a build
every time some source file changes. This needs
[entr](http://eradman.com/entrproject/), which you can install with `brew
install entr` or `sudo apt install entr` or such. Change and save some file,
make sure it's done building, and refresh your browser to see the updates!
