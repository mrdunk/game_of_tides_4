// Copyright 2016 duncan law (mrdunk@gmail.com)

#include <asio.hpp>
#include <boost/date_time/posix_time/posix_time.hpp>
#include <iostream>
#include <string>
#include <mutex>          // std::mutex
#include <thread>         // std::thread
#include <vector>
#include <functional>   // std::bind



#include "backend/data_transport_ws.h"
#include "backend/terrain.h"

int debug;

std::mutex log_lock;
#define LOG(input) log_lock.lock(); std::cout << input << std::endl; log_lock.unlock();

void handler(asio::error_code ec) {
  LOG("timer +")
  sleep(5);
  LOG("timer -")
}

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


  LOG("max threads:" << std::thread::hardware_concurrency())

  // set up an external io_service to run websocket endpoints on.
  asio::io_service ios;

  asio::io_service::work work(ios);

  std::vector<std::thread> threads;
  for (std::size_t i = 0; i < 2; ++i) {
    // More info on binding this method:
    // http://stackoverflow.com/questions/38222141/using-stdbind-on-overloaded-class-method
    auto bound_method = std::bind(
        static_cast<std::size_t(asio::io_service::*)(void)>(
            &asio::io_service::run),
        std::ref(ios));
    threads.push_back(std::thread(bound_method));
  }

  TransportWS<std::string> ws_server(&ios, debug);

  asio::steady_timer t1(ios);
  asio::steady_timer t2(ios);

  t1.expires_from_now(std::chrono::seconds(1));
  t2.expires_from_now(std::chrono::seconds(1));

  t1.async_wait(&handler);
  t2.async_wait(&handler);

  for (std::vector<std::thread>::iterator it = threads.begin();
      it != threads.end(); ++it) {
    it->join();
  }
}
