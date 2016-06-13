#include <iostream>

// $ sudo apt-get install libasio-dev
#define ASIO_STANDALONE
#include <websocketpp/config/asio.hpp>
#include <websocketpp/server.hpp>

// define types for two different server endpoints, one for each config we are
// using
typedef websocketpp::server<websocketpp::config::asio> server_plain;
typedef websocketpp::server<websocketpp::config::asio_tls> server_tls;

using websocketpp::connection_hdl;
using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
using websocketpp::lib::bind;
using websocketpp::lib::ref;

// type of the ssl context pointer is long so alias it
//typedef websocketpp::lib::shared_ptr<boost::asio::ssl::context> context_ptr;
typedef websocketpp::lib::shared_ptr<asio::ssl::context> context_ptr;

// The shared on_message handler takes a template parameter so the function can
// resolve any endpoint dependent types like message_ptr or connection_ptr
template <typename EndpointType>
void on_message(EndpointType* s, websocketpp::connection_hdl hdl, typename EndpointType::message_ptr msg) {
    std::cout << "Message sent to default handler: "<< msg->get_payload() << std::endl;
    
    if (msg->get_payload() == "log") {
        // Upgrade our connection_hdl to a full connection_ptr
        typename EndpointType::connection_ptr con = s->get_con_from_hdl(hdl);

        std::cout << "secure: \t" << con->get_secure() << std::endl;
        std::cout << "host: \t" << con->get_host() << std::endl;
        std::cout << "resource: \t" << con->get_resource() << std::endl;
        std::cout << "port: \t" << con->get_port() << std::endl;
        std::cout << "origin: \t" << con->get_origin() << std::endl;
    }
}


// No change to TLS init methods from echo_server_tls
std::string get_password() {
  return "test";
}

context_ptr on_tls_init(websocketpp::connection_hdl hdl) {
  std::cout << "on_tls_init called with hdl: " << hdl.lock().get() << std::endl;
  context_ptr ctx = websocketpp::lib::make_shared<asio::ssl::context>(asio::ssl::context::tlsv1);
  
  try {
    ctx->set_options(asio::ssl::context::default_workarounds |
                     asio::ssl::context::no_sslv2 |
                     asio::ssl::context::no_sslv3 |
                     asio::ssl::context::single_dh_use
                     );
    ctx->set_password_callback(bind(&get_password));
    ctx->use_certificate_chain_file("keys/cert.pem");
    ctx->use_private_key_file("keys/cert.pem", asio::ssl::context::pem);
  } catch (std::exception& e) {
      std::cout << e.what() << std::endl;
  }
  return ctx;
}

int main() {
  std::cout << "Starting..." << std::endl;
  // set up an external io_service to run both endpoints on. This is not
  // strictly necessary, but simplifies thread management a bit.
  asio::io_service ios;

  // set up plain endpoint
  server_plain endpoint_plain;
  // initialize asio with our external io_service rather than an internal one
  endpoint_plain.init_asio(&ios);
  endpoint_plain.set_message_handler(bind(&on_message<server_plain>,&endpoint_plain,::_1,::_2));
  endpoint_plain.listen(8081);
  endpoint_plain.start_accept();

  // set up tls endpoint
  server_tls endpoint_tls;
  endpoint_tls.init_asio(&ios);
  endpoint_tls.set_message_handler(bind(&on_message<server_tls>,&endpoint_tls,::_1,::_2));
  // TLS endpoint has an extra handler for the tls init
  endpoint_tls.set_tls_init_handler(bind(&on_tls_init,::_1));
  // tls endpoint listens on a different port
  endpoint_tls.listen(8082);
  endpoint_tls.start_accept();

  // Start the ASIO io_service run loop running both endpoints
  ios.run();
}