#include <emscripten/bind.h>
#include "../backend/terrain.cc"

using namespace emscripten;


EMSCRIPTEN_BINDINGS(DataSourceGenerate) {

  value_array<Point>("Point")
    .element(&Point::x)
    .element(&Point::y)
    .element(&Point::z)
    ;

  value_array<std::array<Point, 3>>("std::array")
    .element(index<0>())
    .element(index<1>())
    .element(index<2>())
    ;
  
  value_array<std::array<float, 3>>("std::array")
    .element(index<0>())
    .element(index<1>())
    .element(index<2>())
    ;

  class_<Face>("Face")
    .smart_ptr<std::shared_ptr<Face>>("shared_ptr<Face>")
    .constructor<>()
    .property("index_high", &Face::getIndexHigh, &Face::setIndexHigh)
    .property("index_low", &Face::getIndexLow, &Face::setIndexLow)
    .property("points", &Face::getPoints, &Face::setPoints)
    .property("height", &Face::getHeight, &Face::setHeight)
    .property("heights", &Face::getHeights, &Face::setHeights)
    ;

  register_vector<std::shared_ptr<Face>>("VectorFace");
  
  class_<DataSourceGenerate>("DataSourceGenerate")
    .constructor<>()
    .function("MakeCache", &DataSourceGenerate::MakeCache)
    .function("getFaces",
      select_overload<std::vector<std::shared_ptr<Face>>(
        const unsigned long index_high, const unsigned long index_low,
        const unsigned char recursion, const char required_depth)> (
          &DataSourceGenerate::getFaces))
    .function("pointToFace", &DataSourceGenerate::pointToFace)
    ;
}
