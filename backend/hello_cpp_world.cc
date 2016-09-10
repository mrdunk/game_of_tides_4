// Copyright 2016 duncan law (mrdunk@gmail.com)

#include <asio.hpp>      // http://think-async.com/Asio/asio-1.10.6/doc/index.html
#include <boost/date_time/posix_time/posix_time.hpp>
#include <iostream>
#include <string>
#include <thread>         // std::thread
#include <vector>
#include <functional>   // std::bind

#include "backend/logging.h"
#include "backend/work_queue.h"
#include "backend/tasks.h"
#include "backend/data_transport_ws.h"
#include "backend/terrain.h"

// Number of concurrent connections to process.
// Note that requests from the same connection still get processed in serial.
#define WS_THREADS 2  

int debug;

void handler(asio::error_code e, asio::steady_timer* p_timer,
    WorkQueue<rapidjson::Document>* p_work_queue)
{
#ifdef JOB_TIMER
  LOG("tick\twork_queue: " << p_work_queue->QueueLength()
      << "\taverage wait: " << p_work_queue->AverageWait());
#elif  // JOB_TIMER
  LOG("tick\twork_queue: " << p_work_queue->QueueLength());
#endif

  p_timer->expires_from_now(std::chrono::seconds(5));
  auto timer_handler = std::bind(&handler, _1, p_timer, p_work_queue);
  p_timer->async_wait(timer_handler);
}

int main(int argc, char * argv[]) {
  if (argc > 1 && std::string(argv[1]) == "-d") {
    debug = 1;
  } else {
    debug = 0;
  }

  std::cout << "Hello World!" << std::endl;

  LOG("max threads:" << std::thread::hardware_concurrency());

  uint64_t transport_index = 0;
  uint64_t connection_index = 0;

  // set up an external io_service to run websocket endpoints on.
  asio::io_service ios;

  asio::io_service::work work(ios);

  std::vector<std::thread> threads;
  // More info on binding this method:
  // http://stackoverflow.com/questions/38222141/using-stdbind-on-overloaded-class-method
  auto bound_method = std::bind(
      static_cast<std::size_t(asio::io_service::*)(void)>
      (&asio::io_service::run), std::ref(ios));
  for(int i = 0; i < WS_THREADS; i++){
    threads.push_back(std::thread(bound_method));
  }


  TransportWS ws_server(&ios, &transport_index, &connection_index, debug);
  while (ws_server.ConnectPlain() == 0) {
    // Wait for port to become available.
    sleep(10);
  }
  while (ws_server.ConnectTls() == 0) {
    // Wait for port to become available.
    sleep(10);
  }

  WorkQueue<rapidjson::Document> work_queue(&transport_index, &connection_index,
                                          &threads);
  TaskFinder task_finder(&transport_index, &connection_index);
  TaskEcho test_task(&transport_index, &connection_index);
  
  ws_server.RegisterDestination(&work_queue);
  ws_server.RegisterDestination(&task_finder);
  
  test_task.RegisterDestination(&work_queue);
  test_task.RegisterDestination(&task_finder);

  task_finder.RegisterTask("echo", &test_task);
  task_finder.RegisterTask("echo_return", &ws_server);


  asio::steady_timer recurring_timer(ios);
  recurring_timer.async_wait(std::bind(&handler, _1, &recurring_timer, &work_queue));

  
  for (std::vector<std::thread>::iterator it = threads.begin();
      it != threads.end(); ++it) {
    it->join();
  }
}
