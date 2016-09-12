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
const uint64_t planet_diam = 12742000;  // Diameter of Earth in meters.

// NOTE: It's possible to change the precision of math operations done on this
// type by changing glm::defaultp for another type.
//typedef glm::tvec3< glm::u64, glm::defaultp > Point;
//typedef glm::tvec3< uint32_t, glm::defaultp > Point;
typedef glm::tvec3< glm::f64, glm::defaultp > Point;
//typedef glm::tvec3< glm::f32, glm::defaultp > Point;


class Face {
 public:
  Face() : populated{false} {}

  uint64_t index;
  unsigned long getIndex() const {return index;}
  void setIndex(unsigned long index_) {index = index_;}

  std::array<Point, 3> points;
  std::array<Point, 3> getPoints() const {return points;};
  void setPoints(std::array<Point, 3> value) {};

  int8_t recursion;
  unsigned long getRecursion() const {return recursion;}
  void setRecursion(unsigned long recursion_) {recursion = recursion_;}
  
  bool populated;
  unsigned long getPopulated() const {return populated;}
  void setPopulated(unsigned long populated_) {populated = populated_;}
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
{{{planet_diam/2, planet_diam/2, planet_diam},
  {planet_diam,   planet_diam/2, planet_diam/2}, 
  {planet_diam/2, 0,             planet_diam/2}},

{{planet_diam/2, planet_diam/2, 0},
 {planet_diam,   planet_diam/2, planet_diam/2},
 {planet_diam/2, 0,             planet_diam/2}},

{{planet_diam/2, planet_diam/2, planet_diam},
 {planet_diam/2, 0            , planet_diam/2},
 {0            , planet_diam/2, planet_diam/2}},

{{planet_diam/2, planet_diam/2, 0},
 {planet_diam/2, 0            , planet_diam/2},
 {0            , planet_diam/2, planet_diam/2}},

{{planet_diam/2, planet_diam/2, planet_diam},
 {0            , planet_diam/2, planet_diam/2},
 {planet_diam/2, planet_diam, planet_diam/2}},

{{planet_diam/2, planet_diam/2, 0},
 {0            , planet_diam/2, planet_diam/2},
 {planet_diam/2, planet_diam, planet_diam/2}},

{{planet_diam/2, planet_diam/2, planet_diam},
 {planet_diam/2, planet_diam, planet_diam/2},
 {planet_diam, planet_diam/2, planet_diam/2}},

{{planet_diam/2, planet_diam/2, 0},
 {planet_diam/2, planet_diam  , planet_diam/2},
 {planet_diam  , planet_diam/2, planet_diam/2}}
};


/* Populate the supplied face variable with the top level parent face. */
void IndexToRootFace(uint64_t index, Face* face);
void IndexToRootFace(uint64_t index, Face& face);

/* Get a Face for the requested index at the size appropriate for
* required_depth. */
int8_t IndexToFace(uint64_t index, Face* face, int8_t required_depth);
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
    // TODO: Try lookup from cache before generate.
    std::shared_ptr<Face> p_face(new Face);
    IndexToBiggestFace(index, *p_face);
    return p_face;
  }

  std::shared_ptr<Face> getFace(const uint64_t index, const int8_t recursion) {
    // TODO: Try lookup from cache before generate.
    std::shared_ptr<Face> p_face(new Face);
    IndexToFace(index, *p_face, recursion);
    return p_face;
  }
  
  /* This overload is to provide compatibility with Embind. */ 
  std::vector<std::shared_ptr<Face>> getFaces(const unsigned long index_high,
      const unsigned long index_low, const unsigned char recursion,
      const char required_depth)
  {
    uint64_t index = ((uint64_t)index_high << 32) + index_low;
    return getFaces(index, recursion, required_depth);
  }

  std::vector<std::shared_ptr<Face>> getFaces(const uint64_t index,
      const uint8_t recursion, const int8_t required_depth)
  {
    std::shared_ptr<Face> start_face = getFace(index, recursion);
    return getFaces(start_face, required_depth);
  }

  // TODO: Have this return a unique pointer.
  std::vector<std::shared_ptr<Face>> getFaces(
      const std::shared_ptr<Face> start_face, const int8_t required_depth)
  {
    std::vector<std::shared_ptr<Face>> faces_in;
    std::vector<std::shared_ptr<Face>> faces_out;
    faces_in.push_back(start_face);

    for(int i = start_face->recursion; i < required_depth; i++){
      faces_out.clear();
      for(std::vector<std::shared_ptr<Face>>::iterator parent = faces_in.begin();
          parent != faces_in.end(); parent++)
      {
        // TODO: Try lookup from cache before generate.
        std::shared_ptr<Face> child(new Face);
        FaceToSubface(0, **parent, *child);
        faces_out.push_back(child);
        FaceToSubface(1, **parent, *child);
        faces_out.push_back(child);
        FaceToSubface(2, **parent, *child);
        faces_out.push_back(child);
        FaceToSubface(3, **parent, *child);
        faces_out.push_back(child);
      }
      std::swap(faces_in, faces_out);
    }
    return faces_in;
  }

  /*std::shared_ptr<Face> test(){
    std::shared_ptr<Face> face(new Face);
    face->index = 10;
    return face;
  }*/
  Face test(int i){
    Face face;
    face.index = i;
    face.points[0].x = 10;
    face.points[0].y = 20;
    face.points[0].z = 30;
    face.points[1].x = 11;
    face.points[1].y = 21;
    face.points[1].z = 31;
    face.points[2].x = 12;
    face.points[2].y = 22;
    face.points[2].z = 32;

    return face;
  }

  void test2(){
    std::shared_ptr<Face> face(new Face);
    face->index = 10;
    face->points[0].x = 10;
    face->points[0].y = 20;
    face->points[0].z = 30;
    face->points[1].x = 11;
    face->points[1].y = 21;
    face->points[1].z = 31;
    face->points[2].x = 12;
    face->points[2].y = 22;
    face->points[2].z = 32;

    _vec.push_back(face);
  }

  std::vector<std::shared_ptr<Face>> test3() const {
    return _vec;
  }

  std::shared_ptr<Face> test4(){
    std::shared_ptr<Face> face(new Face);
    return face;
  }

  /*Point test(){
    Point point;
    return point;
  }*/
 private:
  std::vector<std::shared_ptr<Face>> _vec;
};


#endif  // BACKEND_TERRAIN_H_
