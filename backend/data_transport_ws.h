// Copyright 2016 duncan lat (mrdunk@gmail.com)

#ifndef BACKEND_DATA_TRANSPORT_WS_H_
#define BACKEND_DATA_TRANSPORT_WS_H_

// $ sudo apt-get install libasio-dev
#define ASIO_STANDALONE

#define DEBUG

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

#include <iostream>  // cout
#include <string>

#include "backend/data_transport.h"


typedef websocketpp::lib::shared_ptr<asio::ssl::context> context_ptr;

using websocketpp::connection_hdl;
using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
using websocketpp::lib::bind;
using websocketpp::lib::ref;

std::string GetPassword() { return ""; }


template <class Input>
class TransportWS : TransportBase<Input> {
 public:
  explicit TransportWS(asio::io_service* p_ios) : p_ios_(p_ios) {
#ifdef DEBUG
    endpoint_plain_.set_access_channels(websocketpp::log::alevel::all);
    endpoint_plain_.set_error_channels(websocketpp::log::elevel::all);
    endpoint_tls_.set_access_channels(websocketpp::log::alevel::all);
    endpoint_tls_.set_error_channels(websocketpp::log::elevel::all);
#endif

    endpoint_plain_.init_asio(p_ios_);
    endpoint_plain_.set_message_handler(
        bind(&TransportWS::OnWsMessage_<server_plain>, this, ::_1, ::_2));
        //bind(&TransportWS::OnWsMessage_, this, ::_1, ::_2));

    endpoint_plain_.listen(8081);
    endpoint_plain_.start_accept();

    /*endpoint_tls_.init_asio(p_ios_);
    // endpoint_tls_.set_message_handler(
    //    bind(&TransportWS::OnWsMessage_<server_tls>,
    //         &TransportWS::endpoint_tls_, ::_1, ::_2));
    endpoint_tls_.set_message_handler(
          bind(&TransportWS::OnWsMessage_<server_tls>, this, ::_1, ::_2));
    // TLS endpoint has an extra handler for the tls init
    // endpoint_tls_.set_tls_init_handler(bind(&TransportWS::OnTlsInit_, ::_1));
    endpoint_tls_.set_tls_init_handler(
          bind(&TransportWS::OnTlsInit_, this, ::_1));
    // tls endpoint listens on a different port
    endpoint_tls_.listen(8082);
    endpoint_tls_.start_accept();*/
  }

 private:
  template <typename EndpointType>
  void OnWsMessage_(websocketpp::connection_hdl hdl,
                    typename EndpointType::message_ptr msg) {
  //void OnWsMessage_(websocketpp::connection_hdl hdl, server_plain::message_ptr msg) {
    TransportBase<Input>::OnReceive(msg->get_payload());

#ifdef DEBUG
    // Upgrade our connection_hdl to a full connection_ptr
    typename EndpointType::connection_ptr con = endpoint_plain_.get_con_from_hdl(hdl);

    std::cout << "secure: \t" << con->get_secure() << std::endl;
    std::cout << "host: \t" << con->get_host() << std::endl;
    std::cout << "resource: \t" << con->get_resource() << std::endl;
    std::cout << "port: \t" << con->get_port() << std::endl;
    std::cout << "origin: \t" << con->get_origin() << std::endl;
#endif
  }

  context_ptr OnTlsInit_(websocketpp::connection_hdl hdl) {
    std::cout << "OnTlsInit_ called with hdl: " << hdl.lock().get() <<
        std::endl;
    context_ptr ctx = websocketpp::lib::make_shared<asio::ssl::context>(
        asio::ssl::context::tlsv1);

    try {
      ctx->set_options(asio::ssl::context::default_workarounds |
        asio::ssl::context::no_sslv2 | asio::ssl::context::no_sslv3 |
        asio::ssl::context::single_dh_use);
      // For generating certs: http://crossbar.io/docs/TLS-Certificates/
      ctx->set_password_callback(bind(&GetPassword));
      ctx->use_certificate_chain_file("keys/cert.pem");
      ctx->use_private_key_file("keys/key.pem", asio::ssl::context::pem);
    } catch (std::exception &e) {
      std::cout << e.what() << std::endl;
    }
    return ctx;
  }

  asio::io_service* p_ios_;
  server_plain endpoint_plain_;
  server_tls endpoint_tls_;
};

#endif  // BACKEND_DATA_TRANSPORT_WS_H_
