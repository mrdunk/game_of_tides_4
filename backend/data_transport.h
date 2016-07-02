// Copyright 2016 duncan lat (mrdunk@gmail.com)

#ifndef BACKEND_DATA_TRANSPORT_H_
#define BACKEND_DATA_TRANSPORT_H_

#include <stdint.h>   // uint32_t, uint64_t
#include <functional>  // std::bind
#include <string>
#include <iostream>  // cout

template <class Data> class DataExchange;

/* Transfer one data type to another for transmision or after receiving it.
 *
 * Plain: The type of the data to be sent before encoding
 *  or after it is received but before decoding.
 * Encoded: The type of data received before decoding
 *  or after encoding before it is send.
 */
template <class Plain, class Encoded>
class EncoderBase {
 public:
  virtual int Encode(Plain in, Encoded out) = 0;
  virtual int Decode(Encoded in, Plain out) = 0;
};

class EncoderPassString : EncoderBase<std::string, std::string> {
 public:
  int Encode(std::string in, std::string out) {
    out = in;
    return !out.empty();
  }
  int Decode(std::string in, std::string out) {
    out = in;
    return !out.empty();
  }
};

/* A method of sending data between logical components or networked machines.
 *
 * Input: The type of data expected to be sent.
 */
template <class Input>
class TransportBase {
 public:
  int Send(uint32_t address, int type, std::string data);
  void RegisterCallback(DataExchange<Input> *exchange) { consumer_ = exchange; }

 protected:
  void OnReceive(Input data);

 private:
  DataExchange<Input> *consumer_;
};

template <class Input>
void TransportBase<Input>::OnReceive(Input data) {
  consumer_->OnReceive(data);
}

template <class Data>
class DataExchange {
 public:
  void RegisterTransport(TransportBase<Data> transporter) {
    transporter_ = transporter;
    transporter.RegisterCallback(this);
  }
  void RegisterEncoder(EncoderBase<Data, std::string> *p_encoder) {
    p_encoder_ = p_encoder;
  }

  int Send(uint32_t address, int type, Data data) {
    std::string encoded;
    p_encoder_->Encode(data, encoded);
    return transporter_.Send(address, type, encoded);
  }

  void OnReceive(Data data) {
    std::cout << "Received: " << data << std::endl;
  }

 private:
  TransportBase<Data> transporter_;
  EncoderBase<Data, std::string> *p_encoder_;
};

#endif  // BACKEND_DATA_TRANSPORT_H_
