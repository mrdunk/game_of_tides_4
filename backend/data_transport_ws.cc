// Copyright 2016 duncan law (mrdunk@gmail.com)

#include "backend/data_transport_ws.h"


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
  endpoint_tls_.start_accept();
}

template <class Input>
template <typename EndpointType>
void TransportWS<Input>::OnWsMessage_(websocketpp::connection_hdl hdl,
                    typename EndpointType::message_ptr msg,
                    EndpointType* s) {
  std::cout << "OnWsMessage_" << std::endl;
  if (debug_) {
    // Upgrade our connection_hdl to a full connection_ptr
    typename EndpointType::connection_ptr con = s->get_con_from_hdl(hdl);

    std::cout << " secure: \t" << con->get_secure() << std::endl;
    std::cout << " host: \t" << con->get_host() << std::endl;
    std::cout << " resource: \t" << con->get_resource() << std::endl;
    std::cout << " port: \t" << con->get_port() << std::endl;
    std::cout << " origin: \t" << con->get_origin() << std::endl;
  }

  TransportBase<Input>::OnReceive(msg->get_payload());
}

template <class Input>
template <typename EndpointType>
bool TransportWS<Input>::Validate_(websocketpp::connection_hdl hdl,
                                   EndpointType* s) {
  std::cout << "Validate_" << std::endl;
  typename EndpointType::connection_ptr con = s->get_con_from_hdl(hdl);

  const std::vector<std::string> & subp_requests =
  con->get_requested_subprotocols();
  std::vector<std::string>::const_iterator it;

  for (it = subp_requests.begin(); it != subp_requests.end(); ++it) {
    std::cout << " Requested protocol: " << *it << std::endl;
  }

  if (subp_requests.size() > 0) {
    con->select_subprotocol(subp_requests[0]);
    return true;
  }

  return false;
}

template <class Input>
context_ptr TransportWS<Input>::OnTlsInit_(websocketpp::connection_hdl hdl) {
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
    ctx->use_certificate_chain_file("keys/chain.pem");
    ctx->use_private_key_file("keys/key.pem", asio::ssl::context::pem);
  } catch (std::exception &e) {
    std::cout << e.what() << std::endl;
  }
  return ctx;
}

std::string GetPassword() { return ""; }


template class TransportWS<std::string>;
