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
  Face() : populated{false}, height(0), heights({{0,0,0}}) {}

  uint64_t index;
  unsigned long getIndex() const {return index;}
  void setIndex(unsigned long index_) {index = index_;}

  std::array<Point, 3> points;
  std::array<Point, 3> getPoints() const {return points;}
  void setPoints(std::array<Point, 3> value) {}

  int8_t recursion;
  short getRecursion() const {return recursion;}
  void setRecursion(short recursion_) {recursion = recursion_;}
  
  bool populated;
  unsigned long getPopulated() const {return populated;}
  void setPopulated(unsigned long populated_) {populated = populated_;}

  glm::f32 height;
  float getHeight() const {return height;}
  void setHeight(float height_) {height = height_;}

  std::array<float, 3> heights;
  std::array<float, 3> getHeights() const {return heights;}
  void setHeights(std::array<float, 3> value) {/* TODO? */}

  std::set<uint64_t> neighbours;
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

uint64_t IndexOfParent(uint64_t index, int8_t required_depth){
  return (~(uint64_t)0 << (61 - (2 * required_depth))) & index;
}

void FaceToSubface(const uint8_t index, Face parent, Face& child);

/* Return number of common points on 2 faces.
 * Returns:
 *   0: Faces do not touch.
 *   1: Faces share a single corner.
 *   2: Faces share an edge (2 corners).
 *   3: Faces are the same.              */
uint8_t DoFacesTouch(const Face& face_1, const Face& face_2);

/* Returns the index of the point specified or -1 if it's missing. */
int8_t IsPointOnFace(const Face& face, const Point& point);

class FaceCache {
 public:
  FaceCache() : hits(0), misses(0) {}

  std::shared_ptr<Face> Get(uint64_t index, int8_t recursion) {
    index = IndexOfParent(index, recursion);

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
      CalculateNeighbours(p_face);
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
    //LOG("getFaces(" << std::hex << (unsigned long)index_high << ", " << (unsigned long)index_low
    //     << std:: dec << ", " << (unsigned int)recursion  << ", " << 
    //     (unsigned int)required_depth << ")");

    uint64_t index = ((uint64_t)index_high << 32) + index_low;
    return getFaces(index, recursion, required_depth);
  }

  std::vector<std::shared_ptr<Face>> getFaces(const uint64_t index,
      const uint8_t recursion, const int8_t required_depth)
  {
    //LOG("getFaces(" << std::hex << (unsigned long long)index << ", " << std::dec
    //    << (unsigned int)recursion  << ", " << (unsigned int)required_depth << ")");
    
    std::shared_ptr<Face> start_face = getFace(index, recursion);
    return getFaces(start_face, required_depth);
  }

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
          SetCornerHeights(child);
          faces_out.push_back(child);
        }
      }
      std::swap(faces_in, faces_out);
    }
    if(cache_){
      LOG("cache hits: " << cache_->hits << "\tmisses: " << cache_->misses);
    }
    return faces_in;
  }

 private:
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

        float height_total = 0;
        for(auto neighbour = face->neighbours.cbegin();
            neighbour != face->neighbours.cend(); neighbour++)
        {
          auto neighbour_parent_face = getFace(*neighbour, face->recursion -1);
          height_total += neighbour_parent_face->height;
        }

        face->height = height_total / face->neighbours.size();
      }
    }
  }

  void SetCornerHeights(std::shared_ptr<Face> face){
    if(!cache_){
      // Only doing this if cache is used.
      // Otherwise testing would take too long when when cache is disabled.
      return;
    }

    std::array<uint8_t, 3> count;
    for(auto neighbour = face->neighbours.cbegin();
        neighbour != face->neighbours.cend(); neighbour++)
    {
      auto neighbour_face = getFace(*neighbour, face->recursion);
      for(uint8_t corner = 0; corner < 3; corner++){
        if(IsPointOnFace(*neighbour_face, face->points[corner]) >= 0){
          face->heights[corner] += neighbour_face->height;
          count[corner]++;
        }
      }
    }
    for(uint8_t corner = 0; corner < 3; corner++){
      face->heights[corner] += face->height;
      face->heights[corner] /= count[corner];
    }
  }

  void CalculateNeighbours(std::shared_ptr<Face> face){
    if(face->neighbours.size() > 0){
      return;
    }

    if (face->recursion == 0){
      for(uint8_t root_index = 0; root_index < 8; root_index++){
        uint64_t neighbour_index = (uint64_t)root_index << 61;

        std::shared_ptr<Face> neighbour_face(new Face);
        IndexToFace(neighbour_index, *neighbour_face, 0);

        uint8_t touching = DoFacesTouch(*face, *neighbour_face);
        if(touching == 1 || touching == 2){
          face->neighbours.insert(neighbour_index);
        }
      }
    } else {
      std::shared_ptr<Face> parent_face = getFace(face->index, face->recursion -1);

      // Since we are doing most of the lookups involved anyway, let's calculate
      // the heights for all the other child faces of the parent_face.
      std::array<std::shared_ptr<Face>, 4> peers;
      for(int8_t child = 0; child < 4; child++){
        std::shared_ptr<Face> child_face(new Face);
        FaceToSubface(child, *parent_face, *child_face);
        if(child_face->index == face->index){
           peers[child] = face;
        } else {
          peers[child] = child_face;
        }
      }

      for(auto neighbour = parent_face->neighbours.cbegin();
          neighbour != parent_face->neighbours.cend(); neighbour++)
      {
        std::shared_ptr<Face> neighbour_parent_face = getFace(*neighbour, face->recursion -1);
        for(int8_t neighbour_child = 0; neighbour_child < 4; neighbour_child++){
          Face neighbour_child_face;
          FaceToSubface(neighbour_child, *neighbour_parent_face, neighbour_child_face);

          for(int8_t child = 0; child < 4; child++){
            std::shared_ptr<Face> child_face = peers[child];
            
            uint8_t touching = DoFacesTouch(*child_face, neighbour_child_face);
            if(touching == 1 || touching == 2){
              child_face->neighbours.insert(neighbour_child_face.index);
            }
          }
        }
      }

      peers[0]->neighbours.insert(peers[1]->index);
      peers[0]->neighbours.insert(peers[2]->index);
      peers[0]->neighbours.insert(peers[3]->index);
      peers[1]->neighbours.insert(peers[0]->index);
      peers[1]->neighbours.insert(peers[2]->index);
      peers[1]->neighbours.insert(peers[3]->index);
      peers[2]->neighbours.insert(peers[0]->index);
      peers[2]->neighbours.insert(peers[1]->index);
      peers[2]->neighbours.insert(peers[3]->index);
      peers[3]->neighbours.insert(peers[0]->index);
      peers[3]->neighbours.insert(peers[1]->index);
      peers[3]->neighbours.insert(peers[2]->index);

      for(int8_t child = 0; child < 4; child++){
        if(peers[child]->index != face->index){
          // TODO SetHeight doesn't really belong here.
          SetHeight(peers[child]);
          if(cache_){
            cache_->Cache(peers[child]);
          }
        }
      }
    }
  }

  FaceCache* cache_;
};


#endif  // BACKEND_TERRAIN_H_
