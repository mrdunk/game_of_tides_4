// Copyright 2016 duncan law (mrdunk@gmail.com)

#ifndef BACKEND_DATA_TRANSPORT_H_
#define BACKEND_DATA_TRANSPORT_H_

#include <stdint.h>   // uint32_t, uint64_t
#include <functional>  // std::bind
#include <string>
#include <iostream>  // cout

#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/prettywriter.h"  // for stringify JSON


#include "backend/logging.h"


enum DATA_TYPES{
  STRING, JSON
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
  void RegisterDestination(TransportBase* p_destination){
    p_destination_ = p_destination;
  }

  virtual void Consume(std::string* data){
    LOG("Unconsumed data: " << *data);
  }
  virtual void Consume(rapidjson::Document* data){
    LOG("Unconsumed data: " << DisplayJSON(*data));
  }

 protected:
  virtual DATA_TYPES GetExpectedDataType() = 0;

  void  OnReceiveFromEnd(const void* data);

  TransportBase* p_destination_;
};


#endif  // BACKEND_DATA_TRANSPORT_H_
