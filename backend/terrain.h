// Copyright 2016 duncan law (mrdunk@gmail.com)

#ifndef BACKEND_TERRAIN_H_
#define BACKEND_TERRAIN_H_

#include "backend/logging.h"

#include <map>
#include <vector>
#include <set>
#include <memory>             // std::shared_ptr
#include <algorithm>          // std::merge, std::sort std::swap
#include <glm/glm.hpp>        // OpenGL Mathematics library.
#include <glm/gtx/intersect.hpp> // intersectRayTriangle
#include <glm/gtx/norm.hpp>   // distance2
#include <cassert>
#include <atomic>             // std::atomic_ullong

const uint64_t k_top_level_mask = ((uint64_t)7 << 61);
const uint64_t k_root_node_indexes[] = {
  ((uint64_t)0 << 61),
  ((uint64_t)1 << 61),
  ((uint64_t)2 << 61),
  ((uint64_t)3 << 61),
  ((uint64_t)4 << 61),
  ((uint64_t)5 << 61),
  ((uint64_t)6 << 61),
  ((uint64_t)7 << 61)
};

// NOTE: It's possible to change the precision of math operations done on this
// type by changing glm::defaultp for another type.
//typedef glm::tvec3< glm::u64, glm::defaultp > Point;
//typedef glm::tvec3< uint32_t, glm::defaultp > Point;
typedef glm::tvec3< glm::f64, glm::defaultp > Point;
//typedef glm::tvec3< glm::f32, glm::defaultp > Point;

//const uint32_t planet_diam = 12742000;  // Diameter of Earth in meters.
const int64_t planet_radius = 12742 /2;

const double k_scale = planet_radius;

typedef std::pair<uint64_t /*index*/, int8_t /*recursion*/> CacheKey;

enum FaceStatusFlags {
  Populated =  0x01,
  Neighbours = 0x02,
  BaseHeight = 0x04,
  Heights =    0x08
};

struct IndexSplit{
  unsigned long high;
  unsigned long low;
};

class Face {
 public:
  Face() : status(0x00), height(0), heights({{0,0,0}}), last_used(0) {}

  uint64_t index;
  unsigned long getIndexHigh() const {return (index >> 32);}
  void setIndexHigh(unsigned long index_) {index = index_;}
  unsigned long getIndexLow() const {return index;}
  void setIndexLow(unsigned long index_) {index = index_;}

  std::array<Point, 3> points;
  std::array<Point, 3> getPoints() const {return points;}
  void setPoints(std::array<Point, 3> value) {}

  int8_t recursion;
  short getRecursion() const {return recursion;}
  void setRecursion(short recursion_) {recursion = recursion_;}
  
  uint8_t status;
  unsigned long getPopulated() const {return status;}
  void setPopulated(unsigned long status_) {status = status_;}

  glm::f32 height;
  float getHeight() const {return height;}
  void setHeight(float height_) {height = height_;}

  std::array<float, 3> heights;
  std::array<float, 3> getHeights() const {return heights;}
  //void setHeights(std::array<float, 3> value) {/* TODO? */}

  std::set<uint64_t> neighbours;
  std::vector<IndexSplit> getNeighbours() const {
    std::vector<IndexSplit> return_value;
    for(auto neighbour : neighbours){
      IndexSplit entry;
      entry.high = neighbour >> 32;
      entry.low = neighbour;
      return_value.push_back(entry);
    }
    return return_value;
  };
  //void setNeighbours(std::vector<uint64_t> value) {/* TODO? */};
 
  unsigned long long last_used;
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

/* Return the index correct for the required_depth. */
uint64_t IndexAtRecursion(uint64_t index, int8_t required_depth){
  return (~(uint64_t)0 << (61 - (2 * required_depth))) & index;
}

uint64_t IndexOfChild(const uint64_t parent_index, const int8_t parent_depth,
                      const uint8_t child_number){
  return IndexAtRecursion(parent_index, parent_depth) + 
    ((uint64_t)child_number << (59 - (2 * parent_depth)));
}

// TODO Write test.
bool IsChildIndex(const uint64_t parent_index, const int8_t parent_recursion,
                  const uint64_t child_index, const int8_t child_recursion)
{
  if(parent_recursion >= child_recursion){
    return false;
  }
  uint64_t mask = ~0;  // All "1"s.
  mask = mask << (61 - (2 * parent_recursion));
  return (parent_index & mask) == (child_index & mask);
}

bool IsChild(const Face& parent, const Face& child){
  return IsChildIndex(parent.index, parent.recursion, child.index, child.recursion);
}


/* Return one of the 4 child faces of a parent. */
void FaceToSubface(const uint8_t index, const Face& parent, Face& child);

bool VectorCrossesFace(const Point& origin, const Point& vector, const Face& face){
  Point intersect;
  bool ret_val = glm::intersectRayTriangle(origin, vector, face.points[0],
      face.points[1], face.points[2], intersect);

  return ret_val;
}

bool VectorCrossesFace(const Point& vector, const Face& face){
  const Point origin(0,0,0);
  return VectorCrossesFace(origin, vector, face);
}

uint32_t myHash(uint64_t seed) {
  uint32_t hash = 2166136261;
  hash ^= (seed >> 32);
  hash *= 16777619;
  hash ^= seed;
  return hash * 16777619;
}

float myHashFloat(uint64_t seed) {
  return (float)myHash(seed) / 0xFFFFFFFF;
}

/* Return number of common points on 2 faces.
 * Returns:
 *   0: Faces do not touch.
 *   1: Faces share a single corner.
 *   2: Faces share an edge (2 corners).
 *   3: Faces are the same.              */
uint8_t DoFacesTouch(const Face& face_1, const Face& face_2);

/* Returns the index of the point specified or -1 if it's missing. */
int8_t IsPointOnFace(const Face& face, const Point& point);

/* Save and return faces that have already been calculated for later use. */
class FaceCache {
 public:
  FaceCache() : hits(0), misses(0) {}

  // Return a face.
  std::shared_ptr<Face> Get(uint64_t index, int8_t recursion);

  // Store a face.
  void Cache(std::shared_ptr<Face> face);

  // Display some information about cache usage.
  void Report();

  // Do garbage collection.
  void clean(unsigned long long age);

 private:
  uint32_t hits;
  uint32_t misses;
  std::map<std::pair<uint64_t, int8_t>, std::shared_ptr<Face> > cache_;
};


class DataSourceGenerate {
 public:
  DataSourceGenerate(FaceCache* cache) : cache_(cache), update_counter(0) {};
  DataSourceGenerate() : cache_(nullptr), update_counter(0) {};
  void MakeCache() { cache_ = new FaceCache; }

  /* Get a face either by retrieving it from the cache (if available) or by
     generating it. */
  std::shared_ptr<Face> getFace(const uint64_t index, const int8_t recursion,
      const uint8_t recurse_count = 0);
  
 
  /* Get an array of faces which are children of the specified face.*/
  std::vector<std::shared_ptr<Face>> getFaces(const uint64_t index,
      const uint8_t recursion, const int8_t required_depth)
  {
    std::shared_ptr<Face> start_face = getFace(index, recursion);
    return getFaces(start_face, required_depth);
  }

  std::vector<std::shared_ptr<Face>> getFaces(
      const std::shared_ptr<Face>& start_face, const int8_t required_depth);
  
 
  /* Get an array of faces which are children and adjacent of the specified index. */
  std::vector<std::shared_ptr<Face>> getFacesAndSkirt(const uint64_t index,
      const uint8_t recursion, const int8_t required_depth)
  {
    std::vector<std::shared_ptr<Face>> faces = getFaces(index, recursion, required_depth);
    return getFacesAndSkirt(faces);
  }
  
  std::vector<std::shared_ptr<Face>> getFacesAndSkirt(
      const std::shared_ptr<Face>& start_face, const int8_t required_depth)
  {
    std::vector<std::shared_ptr<Face>> faces = getFaces(start_face, required_depth);
    return getFacesAndSkirt(faces);
  }
  
  std::vector<std::shared_ptr<Face>> getFacesAndSkirt(
      std::vector<std::shared_ptr<Face>>& faces);
  

  /* Get an array of child faces which surround the specified face.*/
  std::vector<std::shared_ptr<Face>> getSkirt(const uint64_t index,
      const uint8_t recursion, const int8_t required_depth)
  {
    std::vector<std::shared_ptr<Face>> faces =
      getFaces(index, recursion, required_depth);
    std::vector<std::shared_ptr<Face>> faces_and_skirt =
      getFacesAndSkirt(index, recursion, required_depth);
    return getSkirt(faces, faces_and_skirt);
  }

  std::vector<std::shared_ptr<Face>> getSkirt(
      const std::shared_ptr<Face>& start_face, const int8_t required_depth)
  {
    std::vector<std::shared_ptr<Face>> faces = getFaces(start_face, required_depth);
    std::vector<std::shared_ptr<Face>> faces_and_skirt = 
      getFacesAndSkirt(start_face, required_depth);
    return getSkirt(faces, faces_and_skirt);
  }

  std::vector<std::shared_ptr<Face>> getSkirt(std::vector<std::shared_ptr<Face>>& faces,
      std::vector<std::shared_ptr<Face>>& faces_and_skirt);

  std::shared_ptr<Face> pointToFace(const Point point, const uint8_t max_recursion);
  std::shared_ptr<Face> pointToSubFace(const Point point, const uint8_t max_recursion,
                                       Face& enclosing_face);

  std::shared_ptr<Face> rayCrossesFace(const Point ray_origin,
                                       const Point ray_direction, 
                                       const uint8_t max_recursion);
  std::shared_ptr<Face> rayCrossesSubFace(const Point ray_origin,
                                          const Point ray_direction, 
                                          const uint8_t max_recursion,
                                          Face& enclosing_face);


  /* Do garbage collection on cache. */
  void cleanCache(unsigned long max_cache_age){
    if(max_cache_age < update_counter){
      LOG("update_counter: " << update_counter << "\toldest: " << update_counter - max_cache_age);
      cache_->clean(update_counter - max_cache_age);
    }
  }

 private:

  void SetHeight(std::shared_ptr<Face> face);

  /* Since this gets called from getFace() and it also uses getFace() to get
     multiple neighbouring faces we need to make sure it is not called
     recursively or we will end up trying to modify *all* faces at once.*/
  void SetCornerHeights(std::shared_ptr<Face> face, const uint8_t recurse_count);

  void CalculateNeighbours(std::shared_ptr<Face> face);

  FaceCache* cache_;

  std::atomic_ullong update_counter;
};


#endif  // BACKEND_TERRAIN_H_
