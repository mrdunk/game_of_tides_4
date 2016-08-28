// Copyright 2016 duncan law (mrdunk@gmail.com)

#ifndef BACKEND_DATA_TRANSPORT_H_
#define BACKEND_DATA_TRANSPORT_H_

#include <stdint.h>   // uint32_t, uint64_t
#include <functional>  // std::bind
#include <string>
#include <iostream>    // cout
#include <memory>      // std::shared_ptr

#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/prettywriter.h"  // for stringify JSON


#include "backend/logging.h"

#define MAX_DESTINATIONS 4

// Forward definition.
class TransportBase;

enum DATA_TYPES{
  STRING, JSON
};

struct Path {
  std::array<TransportBase*, MAX_DESTINATIONS> hops;
  uint8_t hop_count;
};


/* Transfer one data type to another.*/
int EncodeData(std::string const& in, rapidjson::Document* out);
int EncodeData(rapidjson::Document const& in, std::string* out);

std::string DisplayJSON(rapidjson::Document const& in);


/* A base class for sending data between logical components.
 * These may be on the same machine or networked.
 */
class TransportBase {
 public:
  TransportBase(uint64_t* p_transport_index, uint64_t* p_connection_index) : 
      path_assign_pointer_(0)
  {
    path_.fill(nullptr);
    path_[path_assign_pointer_++] = this;
    index_ = (*p_transport_index)++;
    p_connection_index_ = p_connection_index;
  }

  void RegisterDestination(TransportBase* p_destination){
    if(path_assign_pointer_ < MAX_DESTINATIONS){
      LOG("TransportBase::RegisterDestination(" << p_destination << ") " << 
          (unsigned int)path_assign_pointer_);
      path_[path_assign_pointer_++] = p_destination;
    } else {
      LOG("ERROR: Too many path elements assigned.");
    }
  }

  virtual void OnReceive(std::string* data, std::shared_ptr<Path> path,
      uint64_t connection_index)
  {
    LOG("Unconsumed data: " << *data);
    LOG("Index:           " << connection_index);
  }
  virtual void OnReceive(std::shared_ptr<rapidjson::Document> data,
      std::shared_ptr<Path> path, uint64_t connection_index)
  {
    LOG("Unconsumed data: " << DisplayJSON(*data));
    LOG("Index:           " << connection_index);  
  }

  std::shared_ptr<Path> NewPath(){
    std::shared_ptr<Path> ret_value(new Path);
    ret_value->hop_count = 1;
    ret_value->hops = path_;
    return ret_value;
  }

 protected:
  virtual DATA_TYPES GetExpectedDataType() = 0;

  void  Send(void* data, std::shared_ptr<Path> path,
                         uint64_t connection_index);

  std::array<TransportBase*, MAX_DESTINATIONS> path_;
  uint8_t path_assign_pointer_;

  uint64_t index_;
  uint64_t* p_connection_index_;
};


#endif  // BACKEND_DATA_TRANSPORT_H_
