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

  class_<Face>("Face")
    .smart_ptr<std::shared_ptr<Face>>("shared_ptr<Face>")
    .constructor<>()
    .property("index", &Face::getIndex, &Face::setIndex)
    .property("points", &Face::getPoints, &Face::setPoints)
    .property("height", &Face::getHeight, &Face::setHeight)
    ;

  register_vector<std::shared_ptr<Face>>("VectorFace");
  
  class_<DataSourceGenerate>("DataSourceGenerate")
    .constructor<>()
    .function("getFaces",
      select_overload<std::vector<std::shared_ptr<Face>>(
        const unsigned long index_high, const unsigned long index_low,
        const unsigned char recursion, const char required_depth)> (
          &DataSourceGenerate::getFaces))
    .function("test", &DataSourceGenerate::test)
    .function("test2", &DataSourceGenerate::test2)
    ;
}
