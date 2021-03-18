# Castle Core ⚙️

Welcome to the new Castle core! This project hopes to be a cross-platform
implementation of Castle's gameplay engine that can be used on web and mobile.
For now the project is starting with a focus on getting web working.

## Directory structure

- **src/**: The C++ core code
- **vendor/**: External libraries we depend on
- **web/**: A simple web harness with a canvas and a launcher for the core WASM
- **assets/**: Static assets for Emscripten to embed into the WASM binary
- **build/**: (ignored in Git) Build output from Emscripten, including the generated WASM binary
- **tools/**: Useful tools for development, including code generation scripts

## Building and running

Make sure all submodules are initialized with `git submodule update --init --recursive`.

You'll need to install CMake and Ninja, which means `brew install cmake ninja`
on macOS, `sudo apt install cmake ninja-build`-ish on Linux or using their
official installers on Windows. `run.sh` needs WSL on Windows.

### Web

#### First-time setup

`./run.sh web-init` to setup Emscripten (our C++ web build toolchain). This
may take a little bit.

#### Build and run

`./run.sh web-release` to build a release version of core for the web. This
will again take a bit the very first time (Emscripten fetches and caches SDL2).
Later builds should (hopefully!) be faster. Every time you edit code in 'src/'
or 'web/' you'll have to run this again.

`./run.sh web-serve-release` will serve core as a website to
http://localhost:9001. This needs Node for the HTTP server. Open that URL with
a browser to check it out! You may want to open the developer console in your
browser to see logging output.

As a bonus, instead of invoking `./run.sh web-release` repeatedly you can use
`./run.sh web-watch-release` to start a file watcher that will launch a build
every time some source file changes. This needs
[entr](http://eradman.com/entrproject/), which you can install with `brew
install entr` or `sudo apt install entr` or such. Change and save some file,
make sure it's done building, and refresh your browser to see the updates!

### Mobile

Core isn't set up for a mobile build yet. Coming soon! It'll probably be
included as a dependency built with native iOS and Android projects in
'../mobile'.

### Desktop

#### Build and run

Core can also be built and run on desktop, just for development purposes (eg.
to use profiling tools or attach a local debugger) and not as an actual
production target. Web is the main priority, so the desktop build may be broken
from time to time.

Use `./run.sh release` for a desktop release build, and `./run.sh debug` for a
debug one. The resulting 'castle-core' executables end up in 'build/release' or
'build/debug' and can be used with a profiler or debugger tool. They need to be
launched with 'core/' as the working directory.

