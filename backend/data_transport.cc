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
void TransportBase::Send(void* data, std::shared_ptr<Path> path,
                                     uint64_t connection_index)
{
  LOG("TransportBase::Send");

  if(path->hops[path->hop_count]){
    if(path->hops[path->hop_count]->GetExpectedDataType() == STRING) {
      std::string converted_to_string;
      if(GetExpectedDataType() == STRING){
        LOG("TODO Translation between types not defined yet.");
      } else if(GetExpectedDataType() == JSON){
        EncodeData(*(static_cast<const rapidjson::Document*>(data)), &converted_to_string);
      }
      path->hops[path->hop_count]->OnReceive(&converted_to_string, path, connection_index);
    } else if(path->hops[path->hop_count]->GetExpectedDataType() == JSON) {
      std::shared_ptr<rapidjson::Document> converted_to_JSON (new rapidjson::Document);
      if(GetExpectedDataType() == STRING){
        EncodeData(*(static_cast<const std::string*>(data)), converted_to_JSON);
      } else if(GetExpectedDataType() == JSON){
        converted_to_JSON = *static_cast<std::shared_ptr<rapidjson::Document>* >(data);
      }
      path->hops[path->hop_count]->OnReceive(converted_to_JSON, path, connection_index);
    }
    path->hop_count++;
  } else {
    LOG("ERROR: No valid next hop set.");
    for(uint8_t i = 0; i < MAX_DESTINATIONS; i++){
      LOG(path->hops[i]);
    }
  }
}
