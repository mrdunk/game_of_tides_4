#include <emscripten/bind.h>
#include "../backend/terrain.cc"
#include <stdint.h>   // uint32_t, uint64_t

using namespace emscripten;


EMSCRIPTEN_BINDINGS(Face) {

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
    ;

  register_vector<std::shared_ptr<Face>>("VectorFace");
//}

//EMSCRIPTEN_BINDINGS(DataSourceGenerate) {
  class_<DataSourceGenerate>("DataSourceGenerate")
    .constructor<>()
    .function("getFaces",
      select_overload<std::vector<std::shared_ptr<Face>>(
        const unsigned long index_high, const unsigned long index_low,
        const unsigned char recursion, const char required_depth)> (
          &DataSourceGenerate::getFaces))
    //.function("getFaces", &DataSourceGenerate::getFaces)
		.function("test", select_overload<Face(int)>(&DataSourceGenerate::test))
    .function("test2", &DataSourceGenerate::test2)
    .function("test3", &DataSourceGenerate::test3)
    .function("test4", &DataSourceGenerate::test4)
    ;
}
