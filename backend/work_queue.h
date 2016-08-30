// Copyright 2016 duncan law (mrdunk@gmail.com)

#ifndef BACKEND_WORK_QUEUE_H_
#define BACKEND_WORK_QUEUE_H_


#define JOB_TIMER


#include <queue>          // std::queue
#include <stdint.h>       // uint32_t, uint64_t
#include <mutex>          // std::mutex, std::lock_guard
#include <unistd.h>       // sleep()
#include <thread>         // std::thread

#ifdef JOB_TIMER
#include <chrono>
#endif

#include "backend/data_transport.h"

#define JOBS_PER_THREAD 2


template <typename Container>
struct Job {
  uint64_t connection_index;
  std::shared_ptr<Container> data;
  std::shared_ptr<Path> path;
#ifdef JOB_TIMER
  std::chrono::steady_clock::time_point start_time;
#endif
};

template <class Container>
class WorkQueue : public TransportBase {
 public:
  WorkQueue(uint64_t* p_transport_index, uint64_t* p_connection_index,
      std::vector<std::thread>* p_threads) :
      TransportBase(p_transport_index, p_connection_index),
      quit_(false), total_wait_time_(0), total_count_(0)
  {
    p_threads->push_back(std::thread(std::bind(&WorkQueue::run, this, 0)));
    p_threads->push_back(std::thread(std::bind(&WorkQueue::run, this, 1)));
  }
 
  DATA_TYPES GetExpectedDataType(){
    return JSON;
  }

  void Push(struct Job<Container>& job){
    std::lock_guard<std::mutex> lock (jobs_mutex_);
#ifdef JOB_TIMER
    job.start_time = std::chrono::steady_clock::now();
#endif
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
#ifdef JOB_TIMER
    // TODO Record latency per thread.
    std::chrono::duration<double> time_span = std::chrono::duration_cast<std::chrono::duration<double>>(std::chrono::steady_clock::now() - p_job->start_time);
    LOG("Popped after: " << time_span.count());
    total_wait_time_ += time_span.count();
    total_count_++;
#endif
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

  /* This will be run once per thread. */
  void run(uint8_t thread_index){
    thread_local static uint8_t thread_index_ = thread_index;
    LOG("Starting WorkQueue::run(" << (unsigned int)thread_index_ << ")");

    while(!quit_){
      // Make it more likely to use lower thread_index if there's only a few
      // jobs to do. Let the other threads sleep.
      if(QueueLength() > thread_index_ * JOBS_PER_THREAD){
        LOG("Waking thread: " << (unsigned int)thread_index_);
        // Once a thread is in use, keep using it as long as there are jobs left.
        while(ExecuteJob() > 0){
          LOG("  Used thread: " << (unsigned int)thread_index_);
        }
        std::this_thread::yield();
      } else {
        std::this_thread::sleep_for(std::chrono::milliseconds(20 * (thread_index +1)));
      }
    }
  }

  unsigned int QueueLength(){
    static unsigned int jobs_length = 0;
    if(jobs_mutex_.try_lock()){
      jobs_length = jobs_.size();
      jobs_mutex_.unlock();
    }
    return jobs_length;
  }

#ifdef JOB_TIMER
  double AverageWait(){
    static double average = 0;
    if(jobs_mutex_.try_lock()){
      average = total_wait_time_ / total_count_;
      jobs_mutex_.unlock();
    }
    return average;
  }
#endif

 private:
  std::mutex jobs_mutex_;
  std::queue<struct Job<Container>> jobs_;
  bool quit_;
  double total_wait_time_;
  unsigned int total_count_;
};


#endif  // BACKEND_WORK_QUEUE_H_
