// Copyright 2016 duncan law (mrdunk@gmail.com)

#ifndef BACKEND_DATA_TASKS_H_
#define BACKEND_DATA_TASKS_H_


#include <unistd.h>                 // sleep
#include <map>
#include "backend/data_transport.h"


class TaskFinder : public TransportBase {
 public:
  TaskFinder(uint64_t* p_transport_index, uint64_t* p_connection_index) :
      TransportBase(p_transport_index, p_connection_index)
  {
  }
 
  DATA_TYPES GetExpectedDataType(){
    return JSON;
  }

  void OnReceive(std::shared_ptr<rapidjson::Document> data,
      std::shared_ptr<Path> path, uint64_t connection_index)
  {
    // LOG("TaskFinder::OnReceive(" << DisplayJSON(*data) << ")");
    if(path->hops[path->hop_count +1]){
      LOG("ERROR: Found unexpected next hop: " <<  static_cast<unsigned int>(path->hop_count));
      for(uint8_t i = 0; i < MAX_DESTINATIONS; i++){
        LOG(path->hops[i]);
      }
      return;
    }
    if(!data->HasMember("request_type")){
      LOG("ERROR: request_type not specified.");
      return;
    }
    if(!(*data)["request_type"].IsString()){
      LOG("ERROR: request_type not string.");
      return;
    }

    LOG("TaskFinder::OnReceive request_type: " << (*data)["request_type"].GetString());
    auto task = tasks_.find((*data)["request_type"].GetString());
    if(task != tasks_.end()){
      task->second->OnReceive(data, path, connection_index);
    } else {
      LOG("ERROR: Task not registered: " << (*data)["request_type"].GetString());
    }
  }

  void RegisterTask(std::string name, TransportBase* task){
    tasks_[name] = task;
  }

 private:
  std::map<std::string, TransportBase*> tasks_;
};


class Task : public TransportBase {
 public:
  Task(uint64_t* p_transport_index, uint64_t* p_connection_index) :
      TransportBase(p_transport_index, p_connection_index)
  {
  }
 
  DATA_TYPES GetExpectedDataType(){
    return JSON;
  }

  void OnReceive(std::shared_ptr<rapidjson::Document> data, std::shared_ptr<Path> /*path*/, 
               uint64_t /*connection_index*/)
  {
    LOG("Task::OnReceive(" << DisplayJSON(*data) << ")");
    sleep(1);
  }
};


#endif  // BACKEND_DATA_TASKS_H_
