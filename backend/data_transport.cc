// Copyright 2016 duncan law (mrdunk@gmail.com)

#include "backend/data_transport.h"
#include "backend/logging.h"


/**** Encoders ****/

int EncodeData(rapidjson::Document const& in, std::string* out) {
  rapidjson::StringBuffer buffer;
  rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
  in.Accept(writer);
  *out = buffer.GetString();
  return !out->empty();
}

int EncodeData(std::string const& in, std::shared_ptr<rapidjson::Document> out) {
  rapidjson::ParseResult ok = out->Parse(in.c_str());
  if (!ok) {
    out->Parse("{\"error\": \"invalid JSON\", \"raw_string\": \"\"}");
    (*out)["raw_string"].SetString(in.c_str(), out->GetAllocator());
  }
  LOG("decoded: " << DisplayJSON(*out));
  return (ok?1:0);
}


/**** Debugging routines. ****/

std::string DisplayJSON(rapidjson::Document const& in) {
  rapidjson::StringBuffer buffer;
  rapidjson::PrettyWriter<rapidjson::StringBuffer> writer(buffer);
  in.Accept(writer);

  return buffer.GetString();
}


/**** TransportBase ****/
void TransportBase::OnReceiveFromEnd(const void* data, uint64_t connection_index) {
  if(p_destination_){
    if(p_destination_->GetExpectedDataType() == STRING) {
      std::string converted_to_string;
      if(GetExpectedDataType() == STRING){
        // Not used.
      } else if(GetExpectedDataType() == JSON){
        EncodeData(*(static_cast<const rapidjson::Document*>(data)), &converted_to_string);
      }
      p_destination_->Consume(&converted_to_string, connection_index);
    } else if(p_destination_->GetExpectedDataType() == JSON) {
      //rapidjson::Document converted_to_JSON;
      std::shared_ptr<rapidjson::Document> converted_to_JSON (new rapidjson::Document);
      if(GetExpectedDataType() == STRING){
        EncodeData(*(static_cast<const std::string*>(data)), converted_to_JSON);
      } else if(GetExpectedDataType() == JSON){
        // Not used
      }
      p_destination_->Consume(converted_to_JSON, connection_index);
    }
  } else {
    //LOG("Unconsumed data: " << data);
  }
}
