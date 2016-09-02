// Copyright 2016 duncan law (mrdunk@gmail.com)

#ifndef BACKEND_DATA_TRANSPORT_WS_H_
#define BACKEND_DATA_TRANSPORT_WS_H_

// $ sudo apt-get install libasio-dev
#define ASIO_STANDALONE

// #define DEBUG

#include <set>
#include <vector>
#include <iostream>  // cout
#include <string>

#include "backend/data_transport.h"
#include "backend/logging.h"

#ifdef DEBUG
#include <websocketpp/config/debug_asio.hpp>
#else
#include <websocketpp/config/asio.hpp>
#endif  // DEBUG

#include <websocketpp/server.hpp>
#include <websocketpp/extensions/permessage_deflate/enabled.hpp>


struct connection_data {
    int sessionid;
    std::string name;
};

// Make our own aiso types that contains connection_data.
#ifdef DEBUG
struct custom_config : public websocketpp::config::debug_core {
    typedef websocketpp::config::debug_aiso core;
#else
struct custom_config : public websocketpp::config::core {
    typedef websocketpp::config::asio core;
#endif  // DEBUG

    typedef core::concurrency_type concurrency_type;
    typedef core::request_type request_type;
    typedef core::response_type response_type;
    typedef core::message_type message_type;
    typedef core::con_msg_manager_type con_msg_manager_type;
    typedef core::endpoint_msg_manager_type endpoint_msg_manager_type;
    typedef core::alog_type alog_type;
    typedef core::elog_type elog_type;
    typedef core::rng_type rng_type;
    //typedef core::transport_type transport_type;
    typedef core::endpoint_base endpoint_base;

    static bool const enable_multithreading = true;

    struct transport_config : public core::transport_config {
      typedef core::concurrency_type concurrency_type;
      typedef core::elog_type elog_type;
      typedef core::alog_type alog_type;
      typedef core::request_type request_type;
      typedef core::response_type response_type;

      static bool const enable_multithreading = true;
    };

    typedef websocketpp::transport::asio::endpoint<transport_config>
      transport_type;


    // Set a custom connection_base class
    typedef connection_data connection_base;
};


#ifdef DEBUG
struct custom_config_tls : public websocketpp::config::debug_core {
    typedef websocketpp::config::debug_aiso_tls core;
#else
struct custom_config_tls : public websocketpp::config::core {
    typedef websocketpp::config::asio_tls core;
#endif  // DEBUG

    typedef core::concurrency_type concurrency_type;
    typedef core::request_type request_type;
    typedef core::response_type response_type;
    typedef core::message_type message_type;
    typedef core::con_msg_manager_type con_msg_manager_type;
    typedef core::endpoint_msg_manager_type endpoint_msg_manager_type;
    typedef core::alog_type alog_type;
    typedef core::elog_type elog_type;
    typedef core::rng_type rng_type;
    typedef core::transport_type transport_type;
    typedef core::endpoint_base endpoint_base;

    // Set a custom connection_base class
    typedef connection_data connection_base;
};

typedef websocketpp::server<custom_config> server_plain;
typedef websocketpp::server<custom_config_tls> server_tls;
//typedef websocketpp::server<websocketpp::config::asio> server_plain;
//typedef websocketpp::server<websocketpp::config::asio_tls> server_tls;

typedef websocketpp::lib::shared_ptr<asio::ssl::context> context_ptr;

using websocketpp::connection_hdl;
using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
using websocketpp::lib::bind;


std::string GetPassword();

class TransportWS : public TransportBase {
 public:
  TransportWS(asio::io_service* p_ios, uint64_t* p_transport_index,
              uint64_t* p_connection_index, const int debug);
  int ConnectPlain();
  int ConnectTls();
  int Stop();

  std::string converted_data;

  DATA_TYPES GetExpectedDataType(){
    return STRING;
  }
 private:
  template <typename EndpointType>
  void OnWsMessage_(websocketpp::connection_hdl hdl,
                    typename EndpointType::message_ptr msg,
                    EndpointType* s);

  template <typename EndpointType>
  bool OnWsValidate_(websocketpp::connection_hdl hdl, EndpointType* s);

  template <typename EndpointType>
  void OnWsOpen_(websocketpp::connection_hdl hdl, EndpointType* s);

  template <typename EndpointType>
  void OnWsClose_(websocketpp::connection_hdl hdl, EndpointType* s);

  context_ptr OnTlsInit_(websocketpp::connection_hdl hdl);

  asio::io_service* p_ios_;
  server_plain endpoint_plain_;
  server_tls endpoint_tls_;
  int debug_;

  typedef std::set<connection_hdl, std::owner_less<connection_hdl>> con_list;
  con_list connections_plain_;
  con_list connections_tls_;
};

#endif  // BACKEND_DATA_TRANSPORT_WS_H_
