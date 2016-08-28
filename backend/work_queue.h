// Copyright 2016 duncan law (mrdunk@gmail.com)

#ifndef BACKEND_WORK_QUEUE_H_
#define BACKEND_WORK_QUEUE_H_

#include <queue>          // std::queue
#include <stdint.h>       // uint32_t, uint64_t
#include <mutex>          // std::mutex, std::lock_guard
#include <unistd.h>       // sleep()
#include <thread>         // std::thread

#include "backend/data_transport.h"

template <typename Container>
struct Job {
  uint64_t connection_index;
  std::shared_ptr<Container> data;
  std::shared_ptr<Path> path;
};

template <class Container>
class WorkQueue : public TransportBase {
 public:
  WorkQueue(uint64_t* p_transport_index, uint64_t* p_connection_index) :
      TransportBase(p_transport_index, p_connection_index),
      quit_(false)
  {
    thread_ = std::thread(std::bind(&WorkQueue::run, this));
  }
 
  DATA_TYPES GetExpectedDataType(){
    return JSON;
  }

  void Push(struct Job<Container>& job){
    std::lock_guard<std::mutex> lock (jobs_mutex_);
    jobs_.push(job);
  }

  int Pop(struct Job<Container>* p_job){
    if(!jobs_mutex_.try_lock()){
      return -1;
    }
    if(jobs_.empty()){
      jobs_mutex_.unlock();
      return 0;
    }
    *p_job = jobs_.front();
    jobs_.pop();
    jobs_mutex_.unlock();
    return 1;
  }

  int ExecuteJob(){
    struct Job<Container> job;
    if(Pop(&job) <= 0){
      return 0;
    }
    LOG("From queue: " << job.connection_index << "\tthread: " << std::this_thread::get_id() << "\tdata: " << DisplayJSON(*(job.data)));
    this->Send(static_cast<void*>(&job.data), job.path,
               job.connection_index);

    return 1;
  }

  void OnReceive(std::shared_ptr<Container> data, std::shared_ptr<Path> path, 
               uint64_t connection_index)
  {
    LOG("WorkQueue::OnReceive(" << DisplayJSON(*data) << ")");
    LOG("WorkQueue::OnReceive(" << connection_index << ")");

    struct Job<Container> job;
    job.connection_index = connection_index;
    job.data = data;
    job.path = path;

    Push(job);
  }

  void run(){
    LOG("Starting WorkQueue::run()");
    while(!quit_){
      if(ExecuteJob() > 0){
      } else {
        sleep(30);
      }
    }
  }

 private:
  std::mutex jobs_mutex_;
  std::queue<struct Job<Container>> jobs_;
  bool quit_;
  std::thread thread_;
};


#endif  // BACKEND_WORK_QUEUE_H_
