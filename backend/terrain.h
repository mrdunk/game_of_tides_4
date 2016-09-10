// Copyright 2016 duncan law (mrdunk@gmail.com)

#ifndef BACKEND_TERRAIN_H_
#define BACKEND_TERRAIN_H_

#include "backend/logging.h"

#include <map>
#include <vector>
#include <memory>             // std::shared_ptr
#include <algorithm>          // std::swap
#include <glm/glm.hpp>        // OpenGL Mathematics library.


const uint64_t k_top_level_mask = ((uint64_t)7 << 61);
const uint64_t k_top_level_shape_0 = ((uint64_t)0 << 61);
const uint64_t k_top_level_shape_1 = ((uint64_t)1 << 61);
const uint64_t k_top_level_shape_2 = ((uint64_t)2 << 61);
const uint64_t k_top_level_shape_3 = ((uint64_t)3 << 61);
const uint64_t k_top_level_shape_4 = ((uint64_t)4 << 61);
const uint64_t k_top_level_shape_5 = ((uint64_t)5 << 61);
const uint64_t k_top_level_shape_6 = ((uint64_t)6 << 61);
const uint64_t k_top_level_shape_7 = ((uint64_t)7 << 61);
const uint64_t k_64bit_max = ((uint64_t)1 << 63);

// NOTE: It's possible to change the precision of math operations done on this
// type by changing glm::defaultp for another type.
typedef glm::tvec3< glm::u64, glm::defaultp > Point;


class Face {
 public:
  Face() : populated{false} {}
  Point points[3];
  int8_t recursion;
  bool populated;
};

inline bool operator==(const Face& lhs, const Face& rhs){
  return lhs.points[0] == rhs.points[0] &&
    lhs.points[1] == rhs.points[1] && 
    lhs.points[2] == rhs.points[2];
}

inline bool operator!=(const Face& lhs, const Face& rhs){
  return !(lhs == rhs);
}


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


/* Populate the supplied face variable with the top level parent face. */
void IndexToRootFace(uint64_t index, Face& face);

/* Get a Face for the requested index at the size appropriate for
* required_depth. */
int8_t IndexToFace(uint64_t index, Face& face, int8_t required_depth);

/* Get the Face matching index at the least recursion (largest size). */
int8_t IndexToBiggestFace(const uint64_t index, Face& face);

/* Return the minimum recursion level this index is valid for. */
int8_t MinRecursionFromIndex(const uint64_t index);

void FaceToSubface(const uint8_t index, Face parent, Face& child);


class DataSourceBase {
 public:
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


class DataSourceGenerate {
 public:
  std::shared_ptr<Face> getFace(const uint64_t index) {
    std::shared_ptr<Face> p_face(new Face);
    IndexToBiggestFace(index, *p_face);
    return p_face;
  }

  std::shared_ptr<Face> getFace(const uint64_t index,
                                const int8_t required_depth)
  {
    std::shared_ptr<Face> p_face(new Face);
    IndexToFace(index, *p_face, required_depth);
    return p_face;
  }
  
  std::vector<std::shared_ptr<Face>> getFaces(std::shared_ptr<Face> start_face,
      const uint64_t index, const int8_t required_depth)
  {
    std::vector<std::shared_ptr<Face>> faces_in;
    std::vector<std::shared_ptr<Face>> faces_out;
    faces_in.push_back(start_face);

    for(int i = start_face->recursion; i < required_depth; i++){
      faces_out.clear();
      for(std::vector<std::shared_ptr<Face>>::iterator parent = faces_in.begin();
          parent != faces_in.end(); parent++)
      {
        std::shared_ptr<Face> child(new Face);
        FaceToSubface(0, **parent, *child);
        faces_out.push_back(child);
      }
      std::swap(faces_in, faces_out);
    }

    return faces_in;
  }

 private:
};


#endif  // BACKEND_TERRAIN_H_
