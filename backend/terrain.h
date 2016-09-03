// Copyright 2016 duncan law (mrdunk@gmail.com)

#ifndef BACKEND_TERRAIN_H_
#define BACKEND_TERRAIN_H_

#include "backend/logging.h"

#include <map>
#include <vector>
#include <memory>             // std::shared_ptr


const uint64_t k_top_level_mask = ((uint64_t)7 << 61);
const uint64_t k_top_level_shape_0 = ((uint64_t)0 << 61);
const uint64_t k_top_level_shape_1 = ((uint64_t)1 << 61);
const uint64_t k_top_level_shape_2 = ((uint64_t)2 << 61);
const uint64_t k_top_level_shape_3 = ((uint64_t)3 << 61);
const uint64_t k_top_level_shape_4 = ((uint64_t)4 << 61);
const uint64_t k_top_level_shape_5 = ((uint64_t)5 << 61);
const uint64_t k_top_level_shape_6 = ((uint64_t)6 << 61);
const uint64_t k_top_level_shape_7 = ((uint64_t)7 << 61);
const uint64_t k_64bit_max = ((uint64_t)2 ^ 63);

typedef struct Point {
  uint64_t x;
  uint64_t y;
  uint64_t z;
} Point;

class Face {
 public:
  Face() : populated{false} {}
  Point points[3];
  bool populated;
};

const uint64_t parent_faces[8][3][3] = 
{{{k_64bit_max/2, k_64bit_max/2, k_64bit_max},
  {k_64bit_max,   k_64bit_max/2, k_64bit_max/2}, 
  {k_64bit_max/2, 0,             k_64bit_max/2}},

{{k_64bit_max/2, k_64bit_max/2, 0},
 {k_64bit_max,   k_64bit_max/2, k_64bit_max/2},
 {k_64bit_max/2, 0,             k_64bit_max/2}},

{{k_64bit_max/2, k_64bit_max/2, k_64bit_max},
 {k_64bit_max/2, 0            , k_64bit_max/2},
 {0            , k_64bit_max/2, k_64bit_max/2}},

{{k_64bit_max/2, k_64bit_max/2, 0},
 {k_64bit_max/2, 0            , k_64bit_max/2},
 {0            , k_64bit_max/2, k_64bit_max/2}},

{{k_64bit_max/2, k_64bit_max/2, k_64bit_max},
 {0            , k_64bit_max/2, k_64bit_max/2},
 {k_64bit_max/2, k_64bit_max, k_64bit_max/2}},

{{k_64bit_max/2, k_64bit_max/2, 0},
 {0            , k_64bit_max/2, k_64bit_max/2},
 {k_64bit_max/2, k_64bit_max, k_64bit_max/2}},

{{k_64bit_max/2, k_64bit_max/2, k_64bit_max},
 {k_64bit_max/2, k_64bit_max, k_64bit_max/2},
 {k_64bit_max, k_64bit_max/2, k_64bit_max/2}},

{{k_64bit_max/2, k_64bit_max/2, 0},
 {k_64bit_max/2, k_64bit_max  , k_64bit_max/2},
 {k_64bit_max  , k_64bit_max/2, k_64bit_max/2}}
};


/* TODO */
void IndexToBiggestFace(uint64_t index, Face& face);


/* TODO */
int8_t IndexToFace(uint64_t index, Face& face, int8_t required_depth);
int8_t IndexToFace(uint64_t index, Face& face);


class DataSourceBase {
 public:
  int getRecursionFromIndex(uint64_t index) {
    for (int i = 0; i < 61; ++i) {
      if (((uint64_t)1 << i) & index) {
        return (62 - i) / 2;
      }
    }
    // Top level face.
    return 0;
  }

  virtual std::shared_ptr<Face> getFace(uint64_t index) = 0;
  virtual void cacheFace(uint64_t /*index*/, std::shared_ptr<Face> /*Face*/) {}
};


class DataSourceCache : DataSourceBase {
 public:
  std::shared_ptr<Face> getFace(uint64_t index) {
    if (cache_.count(index)) {
      return cache_[index];
    }
    return nullptr;
  }

  void cacheFace(uint64_t index, std::shared_ptr<Face> face) { cache_[index] = face; }

 private:
  std::map<uint64_t, std::shared_ptr<Face> > cache_;
};


class DataSourceGenerate : public DataSourceBase {
 public:
  std::shared_ptr<Face> getFace(uint64_t index) {
    std::shared_ptr<Face> p_face(new Face);
    IndexToFace(index, *p_face);
    return p_face;
  }

 private:
};


class Terrain {
 public:
  void addDataSource(DataSourceBase *p_data_source);
  std::shared_ptr<Face> getFace(uint64_t index);

 private:
  std::vector<DataSourceBase *> data_sources_;
};

#endif  // BACKEND_TERRAIN_H_
