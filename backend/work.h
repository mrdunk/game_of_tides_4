// Copyright 2016 duncan law (mrdunk@gmail.com)

#ifndef BACKEND_WORK_H_
#define BACKEND_WORK_H_

#include "backend/data_transport.h"



class Work : public TransportBase {
 public:
  
 void Consume(rapidjson::Document* data) {
    LOG("Work::Consume(" << DisplayJSON(*data) << ")");
  }
  //void Provide(rapidjson::Document* data) {
    // TODO(mrdunk)
  //}
  void RegisterCallback(){
    // TODO(mrdunk)
  }

  DATA_TYPES GetExpectedDataType(){
    return JSON;
  }
};



#endif  // BACKEND_WORK_H_
