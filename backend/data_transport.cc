// Copyright 2016 duncan law (mrdunk@gmail.com)

#include "backend/data_transport.h"
#include "backend/logging.h"


/**** EncoderPassString ****/

int EncoderPassString::Encode(std::string const& in, std::string* out) {
  *out = in;
  return !out->empty();
}

int  EncoderPassString::Decode(std::string const& in, std::string* out) {
  *out = in;
  return !out->empty();
}


/**** EncoderJSON ****/

int EncoderJSON::Encode(rapidjson::Document const& in, std::string* out) {
  rapidjson::StringBuffer buffer;
  rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
  in.Accept(writer);
  *out = buffer.GetString();
  return !out->empty();
}

int EncoderJSON::Decode(std::string const& in, rapidjson::Document* out) {
  LOG("decoding: " << in);
  rapidjson::ParseResult ok = out->Parse(in.c_str());
  if (!ok) {
    out->Parse("{\"error\": \"invalid JSON\", \"raw_string\": \"\"}");
    (*out)["raw_string"].SetString(in.c_str(), out->GetAllocator());
  }
  LOG("decoded: " << EncoderJSON::DisplayJSON(*out));
  return (ok?1:0);
}

std::string EncoderJSON::DisplayJSON(rapidjson::Document const& in) {
  rapidjson::StringBuffer buffer;
  rapidjson::PrettyWriter<rapidjson::StringBuffer> writer(buffer);
  in.Accept(writer);

  return buffer.GetString();
}


/**** TransportBase ****/

template <class Input>
void TransportBase<Input>::OnReceive(std::string data) {
  if (consumer_) {
    consumer_(data);
  } else {
    LOG("Unconsumed data: " << data);
  }
}

// We need to explicitly tell the compiler which data types to build TransportWS
// for otherwise we confuse the linker later.
// http://stackoverflow.com/questions/8752837/undefined-reference-to-template-class-constructor
template class TransportBase<std::string>;
template class TransportBase<rapidjson::Document>;
