// Copyright 2016 duncan lat (mrdunk@gmail.com)

#include <iostream>
#include <string>
#include "backend/data_transport_ws.h"
#include "backend/terrain.h"

int debug;

int main(int argc, char * argv[]) {
  if (argc > 1 && std::string(argv[1]) == "-d") {
    debug = 1;
  } else {
    debug = 0;
  }

  std::cout << "Hello World!" << std::endl;
  std::cout << k_top_level_mask << std::endl;

  Terrain terrain;
  DataSourceGenerate generator;
  terrain.addDataSource(&generator);

  std::cout << generator.getRecursionFromIndex(k_top_level_mask)  << std::endl;
  std::cout << generator.getRecursionFromIndex(0)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)1 << 61)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)2 << 61)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)3 << 61)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)4 << 61)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)5 << 61)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)6 << 61)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)7 << 61)  << std::endl;

  std::cout << generator.getRecursionFromIndex((uint64_t)1 << 60)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)1 << 59)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)1 << 58)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)1 << 57)  << std::endl;


  // set up an external io_service to run websocket endpoints on.
  asio::io_service ios;
  TransportWS<std::string> ws_server(&ios);
  ios.run();
}
