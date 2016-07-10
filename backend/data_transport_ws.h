// Copyright 2016 duncan law (mrdunk@gmail.com)

#ifndef BACKEND_DATA_TRANSPORT_WS_H_
#define BACKEND_DATA_TRANSPORT_WS_H_

// $ sudo apt-get install libasio-dev
#define ASIO_STANDALONE

// #define DEBUG

#ifdef DEBUG
#include <websocketpp/config/debug_asio.hpp>
#include <websocketpp/server.hpp>
typedef websocketpp::server<websocketpp::config::debug_asio> server_plain;
typedef websocketpp::server<websocketpp::config::debug_asio_tls> server_tls;
#else
#include <websocketpp/config/asio.hpp>
#include <websocketpp/server.hpp>
typedef websocketpp::server<websocketpp::config::asio> server_plain;
typedef websocketpp::server<websocketpp::config::asio_tls> server_tls;
#endif  // DEBUG

#include <vector>
#include <iostream>  // cout
#include <string>

#include "backend/data_transport.h"
#include "backend/logging.h"


typedef websocketpp::lib::shared_ptr<asio::ssl::context> context_ptr;

using websocketpp::connection_hdl;
using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
using websocketpp::lib::bind;
using websocketpp::lib::ref;


std::string GetPassword();

template <class Input>
class TransportWS : public TransportBase<Input> {
 public:
  TransportWS(asio::io_service* p_ios, const int debug);

 private:
  template <typename EndpointType>
  void OnWsMessage_(websocketpp::connection_hdl hdl,
                    typename EndpointType::message_ptr msg,
                    EndpointType* s);

  template <typename EndpointType>
  bool Validate_(websocketpp::connection_hdl hdl, EndpointType* s);

  context_ptr OnTlsInit_(websocketpp::connection_hdl hdl);

  asio::io_service* p_ios_;
  server_plain endpoint_plain_;
  server_tls endpoint_tls_;
  int debug_;
};

#endif  // BACKEND_DATA_TRANSPORT_WS_H_
