// Copyright 2016 duncan law (mrdunk@gmail.com)

#include "backend/data_transport_ws.h"
#include "backend/logging.h"


template <class Input>
TransportWS<Input>::TransportWS(asio::io_service* p_ios, const int debug) :
    p_ios_(p_ios), debug_(debug) {
#ifdef DEBUG
  if (debug_) {
    endpoint_plain_.set_access_channels(websocketpp::log::alevel::all);
    endpoint_plain_.set_error_channels(websocketpp::log::elevel::all);
    endpoint_tls_.set_access_channels(websocketpp::log::alevel::all);
    endpoint_tls_.set_error_channels(websocketpp::log::elevel::all);
  }
#endif

  // Unencrypted websocket.
  endpoint_plain_.set_validate_handler(
      bind(&TransportWS::Validate_<server_plain>,
           this, ::_1, &endpoint_plain_));
  endpoint_plain_.init_asio(p_ios_);
  endpoint_plain_.set_message_handler(
      bind(&TransportWS::OnWsMessage_<server_plain>,
           this, ::_1, ::_2, &endpoint_plain_));

  endpoint_plain_.listen(8081);
  endpoint_plain_.set_reuse_addr(true);
  endpoint_plain_.start_accept();

  // Encrypted websocket.
  endpoint_tls_.set_validate_handler(
      bind(&TransportWS::Validate_<server_tls>,
           this, ::_1, &endpoint_tls_));
  endpoint_tls_.init_asio(p_ios_);
  endpoint_tls_.set_message_handler(
      bind(&TransportWS::OnWsMessage_<server_tls>,
           this, ::_1, ::_2, &endpoint_tls_));
  // TLS endpoint has an extra handler for the tls init
  endpoint_tls_.set_tls_init_handler(
      bind(&TransportWS::OnTlsInit_, this, ::_1));
  // tls endpoint listens on a different port
  endpoint_tls_.listen(8082);
  endpoint_tls_.set_reuse_addr(true);
  endpoint_tls_.start_accept();
}

template <class Input>
template <typename EndpointType>
void TransportWS<Input>::OnWsMessage_(websocketpp::connection_hdl hdl,
                    typename EndpointType::message_ptr msg,
                    EndpointType* s) {
  LOG("OnWsMessage_");
  if (debug_) {
    // Upgrade our connection_hdl to a full connection_ptr
    typename EndpointType::connection_ptr con = s->get_con_from_hdl(hdl);

    LOG(" secure: \t" << con->get_secure());
    LOG(" host: \t" << con->get_host());
    LOG(" resource: \t" << con->get_resource());
    LOG(" port: \t" << con->get_port());
    LOG(" origin: \t" << con->get_origin());
  }

  // TransportBase<Input>::OnReceive(msg->get_payload());
  this->OnReceive(msg->get_payload());

  if (msg->get_payload() == "hangup") {
    if (endpoint_plain_.is_listening()) {
      endpoint_plain_.stop_perpetual();
      endpoint_plain_.stop_listening();
    }
    if (endpoint_tls_.is_listening()) {
      endpoint_tls_.stop_perpetual();
      endpoint_tls_.stop_listening();
    }
  }
}

template <class Input>
template <typename EndpointType>
bool TransportWS<Input>::Validate_(websocketpp::connection_hdl hdl,
                                   EndpointType* s) {
  LOG("Validate_");
  typename EndpointType::connection_ptr con = s->get_con_from_hdl(hdl);

  const std::vector<std::string> & subp_requests =
      con->get_requested_subprotocols();
  std::vector<std::string>::const_iterator it;

  for (it = subp_requests.begin(); it != subp_requests.end(); ++it) {
    LOG(" Requested protocol: " << *it);
  }

  if (subp_requests.size() > 0) {
    con->select_subprotocol(subp_requests[0]);
    return true;
  }

  return false;
}

template <class Input>
context_ptr TransportWS<Input>::OnTlsInit_(websocketpp::connection_hdl hdl) {
  LOG("OnTlsInit_ called with hdl: " << hdl.lock().get());
  context_ptr ctx = websocketpp::lib::make_shared<asio::ssl::context>(
      asio::ssl::context::tlsv1);

  try {
    ctx->set_options(asio::ssl::context::default_workarounds |
        asio::ssl::context::no_sslv2 | asio::ssl::context::no_sslv3 |
        asio::ssl::context::single_dh_use);
    // For generating certs: http://crossbar.io/docs/TLS-Certificates/
    ctx->set_password_callback(bind(&GetPassword));
    ctx->use_certificate_chain_file("keys/chain.pem");
    ctx->use_private_key_file("keys/key.pem", asio::ssl::context::pem);
  } catch (std::exception &e) {
    LOG(e.what());
  }
  return ctx;
}

std::string GetPassword() { return ""; }

// We need to explicitly tell the compiler which data types to build TransportWS
// for otherwise we confuse the linker later.
// http://stackoverflow.com/questions/8752837/undefined-reference-to-template-class-constructor
template class TransportWS<std::string>;
template class TransportWS<rapidjson::Document>;
