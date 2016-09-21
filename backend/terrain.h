// Copyright 2016 duncan law (mrdunk@gmail.com)

#ifndef BACKEND_TERRAIN_H_
#define BACKEND_TERRAIN_H_

#include "backend/logging.h"

#include <map>
#include <vector>
#include <memory>             // std::shared_ptr
#include <algorithm>          // std::swap
#include <glm/glm.hpp>        // OpenGL Mathematics library.
#include <cassert>

const uint64_t k_top_level_mask = ((uint64_t)7 << 61);
const uint64_t k_top_level_shape_0 = ((uint64_t)0 << 61);
const uint64_t k_top_level_shape_1 = ((uint64_t)1 << 61);
const uint64_t k_top_level_shape_2 = ((uint64_t)2 << 61);
const uint64_t k_top_level_shape_3 = ((uint64_t)3 << 61);
const uint64_t k_top_level_shape_4 = ((uint64_t)4 << 61);
const uint64_t k_top_level_shape_5 = ((uint64_t)5 << 61);
const uint64_t k_top_level_shape_6 = ((uint64_t)6 << 61);
const uint64_t k_top_level_shape_7 = ((uint64_t)7 << 61);

// NOTE: It's possible to change the precision of math operations done on this
// type by changing glm::defaultp for another type.
//typedef glm::tvec3< glm::u64, glm::defaultp > Point;
//typedef glm::tvec3< uint32_t, glm::defaultp > Point;
typedef glm::tvec3< glm::f64, glm::defaultp > Point;
//typedef glm::tvec3< glm::f32, glm::defaultp > Point;

//const uint32_t planet_diam = 12742000;  // Diameter of Earth in meters.
const int64_t planet_radius = 12742 /2;


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
  short getRecursion() const {return recursion;}
  void setRecursion(short recursion_) {recursion = recursion_;}
  
  bool populated;
  unsigned long getPopulated() const {return populated;}
  void setPopulated(unsigned long populated_) {populated = populated_;}

  glm::f32 height;
  float getHeight() const {return height;}
  void setHeight(float height_) {height = height_;}
};

inline bool operator==(const Face& lhs, const Face& rhs){
  return lhs.points[0] == rhs.points[0] &&
    lhs.points[1] == rhs.points[1] && 
    lhs.points[2] == rhs.points[2];
}

inline bool operator!=(const Face& lhs, const Face& rhs){
  return !(lhs == rhs);
}

const int32_t parent_faces[8][3][3] = {
 {{0,             0,              planet_radius},
  {0,              -planet_radius, 0},
  {planet_radius,  0,              0}},

 {{0,              0,              -planet_radius},
  {planet_radius,  0,              0},
  {0,              -planet_radius, 0}},

 {{0,              0,              planet_radius},
  {-planet_radius, 0,              0},
  {0,              -planet_radius, 0}},

 {{0,              0,              -planet_radius},
  {0,              -planet_radius, 0},
  {-planet_radius, 0,              0}},

 {{0,              0,              planet_radius},
  {0,              planet_radius,  0},
  {-planet_radius, 0,              0}},

 {{0,               0,              -planet_radius},
  {-planet_radius,  0,              0},
  {0,               planet_radius,  0}},

 {{0,               0,              planet_radius},
  {planet_radius,   0,              0},
  {0,               planet_radius,  0}},

 {{0,               0,              -planet_radius},
  {0,               planet_radius,  0},
  {planet_radius,   0,              0}},
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

/* Return number of common points on 2 faces.
 * Returns:
 *   0: Faces do not touch.
 *   1: Faces share a single corner.
 *   2: Faces share an edge (2 corners).
 *   3: Faces are the same.              */
uint8_t DoFacesTouch(const Face& face_1, const Face& face_2);


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
        std::shared_ptr<Face> child_0(new Face);
        FaceToSubface(0, **parent, *child_0);
        faces_out.push_back(child_0);

        std::shared_ptr<Face> child_1(new Face);
        FaceToSubface(1, **parent, *child_1);
        faces_out.push_back(child_1);

        std::shared_ptr<Face> child_2(new Face);
        FaceToSubface(2, **parent, *child_2);
        faces_out.push_back(child_2);

        std::shared_ptr<Face> child_3(new Face);
        FaceToSubface(3, **parent, *child_3);
        faces_out.push_back(child_3);
      }
      std::swap(faces_in, faces_out);
    }
    return faces_in;
  }

  Point test(unsigned char index, unsigned char point){
    Face face = {};
    //IndexToFace(((uint64_t)index << 61), face, 0);
    IndexToRootFace(((uint64_t)index << 61), face);
    return face.points[point];
  }

  double test2(unsigned char index, unsigned char point, unsigned char axis){
    return parent_faces[index][point][axis];
  }

 private:
};


#endif  // BACKEND_TERRAIN_H_
