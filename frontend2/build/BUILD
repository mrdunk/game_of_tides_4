Install Emscripten according to:
https://developer.mozilla.org/en-US/docs/WebAssembly/C_to_wasm

Install these:
$ sudo apt-get install gcc-multilib g++-multilib libglm-dev

Link libglm-dev to where Emscripten can use it:
$ ln -s /usr/include/glm /home/duncan/Working/emsdk/emscripten/incoming/system/include/glm



../../emscripten/emcc -Wall -I/home/duncan/Working/game_of_tides_4/ --bind -o wrap_terrain.js ../wrap_terrain.cc -O2 --memory-init-file 0 -s ALLOW_MEMORY_GROWTH=1
../../../emsdk/emscripten/incoming/emcc -Wall -Werror -I/home/duncan/Working/game_of_tides_4/ --bind -o wrap_terrain.js ../wrap_terrain.cc -O2 --memory-init-file 0 -s TOTAL_MEMORY=1073741824
