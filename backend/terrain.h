// Copyright 2016 duncan law (mrdunk@gmail.com)

#ifndef BACKEND_TERRAIN_H_
#define BACKEND_TERRAIN_H_

#include <map>
#include <vector>

const uint64_t k_top_level_mask = ((uint64_t)7 << 61);
const uint64_t k_top_level_shape_0 = ((uint64_t)0 << 61);
const uint64_t k_top_level_shape_1 = ((uint64_t)1 << 61);
const uint64_t k_top_level_shape_2 = ((uint64_t)2 << 61);
const uint64_t k_top_level_shape_3 = ((uint64_t)3 << 61);
const uint64_t k_top_level_shape_4 = ((uint64_t)4 << 61);
const uint64_t k_top_level_shape_5 = ((uint64_t)5 << 61);
const uint64_t k_top_level_shape_6 = ((uint64_t)6 << 61);
const uint64_t k_top_level_shape_7 = ((uint64_t)7 << 61);
const uint64_t k_64bit_max = ((uint64_t)2 ^ 64);

typedef struct Point {
  uint64_t x;
  uint64_t y;
  uint64_t z;
} Point;

class Face {
 public:
  Face() : populated_{false} {}
  bool isPopulated() { return populated_; }
  Point points[3];

 private:
  bool populated_;
};

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

  virtual Face getFace(uint64_t index) = 0;
  virtual void cacheFace(uint64_t index, Face Face) {}
};

class DataSourceCache : DataSourceBase {
 public:
  Face getFace(uint64_t index) {
    Face Face;
    if (cache_.count(index)) {
      return cache_[index];
    }
  }
  void cacheFace(uint64_t index, Face Face) { cache_[index] = Face; }

 private:
  std::map<uint64_t, Face> cache_;
};

class DataSourceGenerate : public DataSourceBase {
 public:
  Face getFace(uint64_t index) {
    // TODO(duncan): put this data in an array.
    Face parent_face;
    if ((index & k_top_level_mask) == index) {
      if (index & k_top_level_shape_0) {
        parent_face.points[0].x = k_64bit_max / 2;
        parent_face.points[0].y = k_64bit_max / 2;
        parent_face.points[0].z = k_64bit_max;
        parent_face.points[1].x = k_64bit_max;
        parent_face.points[1].y = k_64bit_max / 2;
        parent_face.points[1].z = k_64bit_max / 2;
        parent_face.points[2].x = k_64bit_max / 2;
        parent_face.points[2].y = 0;
        parent_face.points[2].z = k_64bit_max / 2;
      } else if (index & k_top_level_shape_1) {
        parent_face.points[0].x = k_64bit_max / 2;
        parent_face.points[0].y = k_64bit_max / 2;
        parent_face.points[0].z = 0;
        parent_face.points[1].x = k_64bit_max;
        parent_face.points[1].y = k_64bit_max / 2;
        parent_face.points[1].z = k_64bit_max / 2;
        parent_face.points[2].x = k_64bit_max / 2;
        parent_face.points[2].y = 0;
        parent_face.points[2].z = k_64bit_max / 2;
      } else if (index & k_top_level_shape_2) {
        parent_face.points[0].x = k_64bit_max / 2;
        parent_face.points[0].y = k_64bit_max / 2;
        parent_face.points[0].z = k_64bit_max;
        parent_face.points[1].x = k_64bit_max / 2;
        parent_face.points[1].y = 0;
        parent_face.points[1].z = k_64bit_max / 2;
        parent_face.points[2].x = 0;
        parent_face.points[2].y = k_64bit_max / 2;
        parent_face.points[2].z = k_64bit_max / 2;
      } else if (index & k_top_level_shape_3) {
        parent_face.points[0].x = k_64bit_max / 2;
        parent_face.points[0].y = k_64bit_max / 2;
        parent_face.points[0].z = 0;
        parent_face.points[1].x = k_64bit_max / 2;
        parent_face.points[1].y = 0;
        parent_face.points[1].z = k_64bit_max / 2;
        parent_face.points[2].x = 0;
        parent_face.points[2].y = k_64bit_max / 2;
        parent_face.points[2].z = k_64bit_max / 2;
      } else if (index & k_top_level_shape_4) {
        parent_face.points[0].x = k_64bit_max / 2;
        parent_face.points[0].y = k_64bit_max / 2;
        parent_face.points[0].z = k_64bit_max;
        parent_face.points[1].x = 0;
        parent_face.points[1].y = k_64bit_max / 2;
        parent_face.points[1].z = k_64bit_max / 2;
        parent_face.points[2].x = k_64bit_max / 2;
        parent_face.points[2].y = k_64bit_max;
        parent_face.points[2].z = k_64bit_max / 2;
      } else if (index & k_top_level_shape_5) {
        parent_face.points[0].x = k_64bit_max / 2;
        parent_face.points[0].y = k_64bit_max / 2;
        parent_face.points[0].z = 0;
        parent_face.points[1].x = 0;
        parent_face.points[1].y = k_64bit_max / 2;
        parent_face.points[1].z = k_64bit_max / 2;
        parent_face.points[2].x = k_64bit_max / 2;
        parent_face.points[2].y = k_64bit_max;
        parent_face.points[2].z = k_64bit_max / 2;
      } else if (index & k_top_level_shape_6) {
        parent_face.points[0].x = k_64bit_max / 2;
        parent_face.points[0].y = k_64bit_max / 2;
        parent_face.points[0].z = k_64bit_max;
        parent_face.points[1].x = k_64bit_max / 2;
        parent_face.points[1].y = k_64bit_max;
        parent_face.points[1].z = k_64bit_max / 2;
        parent_face.points[2].x = k_64bit_max;
        parent_face.points[2].y = k_64bit_max / 2;
        parent_face.points[2].z = k_64bit_max / 2;
      } else if (index & k_top_level_shape_7) {
        parent_face.points[0].x = k_64bit_max / 2;
        parent_face.points[0].y = k_64bit_max / 2;
        parent_face.points[0].z = 0;
        parent_face.points[1].x = k_64bit_max / 2;
        parent_face.points[1].y = k_64bit_max;
        parent_face.points[1].z = k_64bit_max / 2;
        parent_face.points[2].x = k_64bit_max;
        parent_face.points[2].y = k_64bit_max / 2;
        parent_face.points[2].z = k_64bit_max / 2;
      }
    }
    return parent_face;
  }

 private:
};

class Terrain {
 public:
  void addDataSource(DataSourceBase *p_data_source);
  Face getFace(uint64_t index);

 private:
  std::vector<DataSourceBase *> data_sources_;
};

#endif  // BACKEND_TERRAIN_H_
