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

Make sure all submodules are initialized with `git submodule update --init --recursive`.

### Web

#### First-time setup

You'll need to install CMake, which means `brew install cmake` on macOS, `sudo apt install cmake`-ish
on Linux or using their official installer on Windows. `run.sh` needs WSL on Windows.

`./run.sh web-init` to setup Emscripten (our C++ web build toolchain).  This
may take a little bit.

#### Building

`./run.sh web-release` to build a release version of core for the web. This
will again take a bit the very first time (Emscripten fetches and caches SDL2).
Later builds should (hopefully!) be faster. Every time you edit code in 'src/'
or 'web/' you'll have to run this again.

`./run.sh web-serve-release` will serve core as a website to
http://localhost:8080. Open that URL with a browser to check it out! You may
want to open the developer console in your browser to see logging output.

As a bonus, instead of invoking `./run.sh web-release` repeatedly you can use
`./run.sh web-watch-release` to start a file watcher that will launch a build
every time some source file changes. This needs
[entr](http://eradman.com/entrproject/), which you can install with `brew
install entr` or `sudo apt install entr` or such. Change and save some file,
make sure it's done building, and refresh your browser to see the updates!
