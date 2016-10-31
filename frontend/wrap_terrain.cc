#include <emscripten/bind.h>
#include "../backend/terrain.cc"

using namespace emscripten;


IndexSplit IndexSplitOfChild(const unsigned long parent_index_high,
    const unsigned long parent_index_low,
    const int8_t parent_depth, const uint8_t child_number)
{
  uint64_t parent_index = (static_cast<uint64_t>(parent_index_high) << 32) + parent_index_low;
  uint64_t child_index = IndexOfChild(parent_index, parent_depth, child_number);
  return {static_cast<unsigned long>(child_index >> 32), static_cast<unsigned long>(child_index)};
}

bool IsChildSplit(const unsigned long parent_index_high, const unsigned long parent_index_low,
    const int8_t parent_recursion, const unsigned long child_index_high,
    const unsigned long child_index_low, const int8_t child_recursion)
{
  uint64_t parent_index = (static_cast<uint64_t>(parent_index_high) << 32) + parent_index_low;
  uint64_t child_index = (static_cast<uint64_t>(child_index_high) << 32) + child_index_low;
  return IsChildIndex(parent_index, parent_recursion, child_index, child_recursion);
}

EMSCRIPTEN_BINDINGS(DataSourceGenerate) {

  value_array<Point>("Point")
    .element(&Point::x)
    .element(&Point::y)
    .element(&Point::z)
    ;

  value_array<std::array<Point, 3>>("Points")
    .element(index<0>())
    .element(index<1>())
    .element(index<2>())
    ;
  
  value_array<std::array<float, 3>>("std::array<float,3>")
    .element(index<0>())
    .element(index<1>())
    .element(index<2>())
    ;

  value_array<IndexSplit>("IndexSplit")
    .element(&IndexSplit::high)
    .element(&IndexSplit::low)
    ;

  register_vector<IndexSplit>("Indexes");
  
  register_vector<std::shared_ptr<Face>>("VectorFace");

  class_<Face>("Face")
    .smart_ptr<std::shared_ptr<Face>>("shared_ptr<Face>")
    .constructor<>()
    .property("index_high", &Face::getIndexHigh, &Face::setIndexHigh)
    .property("index_low", &Face::getIndexLow, &Face::setIndexLow)
    .property("points", &Face::getPoints, &Face::setPoints)
    .property("height", &Face::getHeight, &Face::setHeight)
    .property("heights", &Face::getHeights)
    .property("neighbours", &Face::getNeighbours)  //, &Face::setNeighbours)
    ;

  class_<DataSourceGenerate>("DataSourceGenerate")
    .constructor<>()
    .function("MakeCache", &DataSourceGenerate::MakeCache)
    .function("cleanCache", &DataSourceGenerate::cleanCache)
    .function("getFaces",
      select_overload<std::vector<std::shared_ptr<Face>>(
        const unsigned long index_high, const unsigned long index_low,
        const unsigned char recursion, const char required_depth)> (
          &DataSourceGenerate::getFaces))
    .function("pointToFace", &DataSourceGenerate::pointToFace)
    .function("pointToSubFace", &DataSourceGenerate::pointToFace)
    ;

  function("IndexOfChild", &IndexSplitOfChild);
  function("IsChild", &IsChildSplit);
}
