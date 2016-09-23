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

typedef std::pair<uint64_t, int8_t> CacheKey;

class Face {
 public:
  Face() : populated{false}, height(0) {}

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

int8_t GetNeighbours(const uint64_t target_index, int8_t target_recursion,
                   uint64_t* neighbours);

class FaceCache {
 public:
  FaceCache() : hits(0), misses(0) {}

  std::shared_ptr<Face> Get(uint64_t index, int8_t recursion) {
    if (cache_.count(CacheKey(index, recursion))) {
      hits++;
      return cache_[CacheKey(index, recursion)];
    }
    misses++;
    return nullptr;
  }

  void Cache(std::shared_ptr<Face> face) { 
    cache_[CacheKey(face->index, face->recursion)] = face;
  }

  uint32_t hits;
  uint32_t misses;
 private:
  std::map<std::pair<uint64_t, int8_t>, std::shared_ptr<Face> > cache_;
};


class DataSourceGenerate {
 public:
  DataSourceGenerate(FaceCache* cache) : cache_(cache) {};
  DataSourceGenerate() : cache_(nullptr) {};
  void MakeCache() { cache_ = new FaceCache; }

  std::shared_ptr<Face> getFace(const uint64_t index, const int8_t recursion) {
    std::shared_ptr<Face> p_face;
    if(cache_){
      p_face = cache_->Get(index, recursion);
    }
    if(!p_face){
      std::shared_ptr<Face> p_face_new(new Face);
      p_face = p_face_new;
      IndexToFace(index, *p_face, recursion);
      SetHeight(p_face);
      if(cache_){
        cache_->Cache(p_face);
      }
    }
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
        for(uint8_t c = 0; c < 4; c++){
          uint64_t child_index = (*parent)->index + 
              ((uint64_t)c << (59 - (2 * (*parent)->recursion)));
          std::shared_ptr<Face> child = getFace(child_index, (*parent)->recursion +1);
          faces_out.push_back(child);
        }
      }
      std::swap(faces_in, faces_out);
    }
    if(cache_){
      LOG("hits: " << cache_->hits << "\tmisses: " << cache_->misses);
    }
    LOG("Done getFaces");
    return faces_in;
  }

  int my_hash(uint64_t seed) {
      seed = 6364136223846793005ULL*seed + 1;
      return seed>>49;
  }

  void SetHeight(std::shared_ptr<Face> face){
    if(face->height > 0){
      return;
    }

    if(MinRecursionFromIndex(face->index) <= 2){
      if (my_hash(face->index) < 8000) {
        face->height = 1;
      } else {
        face->height = 0;
      }
    } else if (MinRecursionFromIndex(face->index) > 2) {
      if(cache_){
        // Only doing this if cache is used.
        // Otherwise testing would take too long when when cache is disabled.
        uint64_t neighbours[3];
        GetNeighbours(face->index, face->recursion, neighbours);
        auto neighbour_0_face = getFace(neighbours[0], face->recursion -1);
        auto neighbour_1_face = getFace(neighbours[1], face->recursion -1);
        auto neighbour_2_face = getFace(neighbours[2], face->recursion -1);

        face->height = (neighbour_0_face->height + neighbour_1_face->height +
            neighbour_2_face->height) / 3;
        /*if(neighbour_0_face->height >= 0.5 ||
            neighbour_1_face->height >= 0.5 || 
            neighbour_2_face->height >= 0.5){
          face->height = 0.25;
        }*/

      }
    }
  }

 private:
  FaceCache* cache_;
};


#endif  // BACKEND_TERRAIN_H_
