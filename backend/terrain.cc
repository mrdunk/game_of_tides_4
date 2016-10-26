// Copyright 2016 duncan law (mrdunk@gmail.com)

#include "backend/terrain.h"


int8_t MinRecursionFromIndex(const uint64_t index){
  /*  for (int i = 0; i < 61; ++i) {
      if (((uint64_t)1 << i) & index) {
        return (62 - i) / 2;
      }
    }
    // Top level face.
    return 0;*/
  int8_t return_value = 0;
  uint64_t index_ = index & ~((uint64_t)7 << 61);
  while (index_ > 0){
    return_value++;
    index_ &= ~((uint64_t)3 << (61 - (2 * return_value)));
  }
  return return_value;
}

void IndexToRootFace(uint64_t index, Face& face){
  IndexToRootFace(index, &face);
}

void IndexToRootFace(uint64_t index, Face* face){
  //LOG("IndexToRootFace(" << index << ", face)");
  //index &= k_top_level_mask;
  face->index = index & k_top_level_mask;
  face->recursion = 0;
  face->status |= Populated;
  face->height = 0;
  index = (index >> 61);
  face->points[0].x = parent_faces[index][0][0];
  face->points[0].y = parent_faces[index][0][1];
  face->points[0].z = parent_faces[index][0][2];
  face->points[1].x = parent_faces[index][1][0];
  face->points[1].y = parent_faces[index][1][1];
  face->points[1].z = parent_faces[index][1][2];
  face->points[2].x = parent_faces[index][2][0];
  face->points[2].y = parent_faces[index][2][1];
  face->points[2].z = parent_faces[index][2][2];
}

void MidPoint(const Point a, const Point b, Point& mid){
  mid.x = (a.x / 2) + (b.x / 2);
  mid.y = (a.y / 2) + (b.y / 2);
  mid.z = (a.z / 2) + (b.z / 2);
}

inline Point WrapNormalize(const Point& input){
#ifdef UNIT_TESTING
  return input;
#else
  return glm::normalize(input) * k_scale;
#endif  // UNIT_TESTING
}

void FaceToSubface(const uint8_t sub_index, const Face& parent, Face& child){
  child.index = IndexOfChild(parent.index, parent.recursion, sub_index);
  child.recursion = parent.recursion +1;
  child.status = true;
  switch(sub_index){
    case 0:
      MidPoint(parent.points[1], parent.points[2], child.points[0]);
      child.points[0] = WrapNormalize(child.points[0]);
      MidPoint(parent.points[0], parent.points[2], child.points[1]);
      child.points[1] = WrapNormalize(child.points[1]);
      MidPoint(parent.points[0], parent.points[1], child.points[2]);
      child.points[2] = WrapNormalize(child.points[2]);
      child.height = parent.height;
      return;
    case 1:
      child.points[0] = parent.points[0];
      child.points[0] = WrapNormalize(child.points[0]);
      MidPoint(parent.points[0], parent.points[1], child.points[1]);
      child.points[1] = WrapNormalize(child.points[1]);
      MidPoint(parent.points[0], parent.points[2], child.points[2]);
      child.points[2] = WrapNormalize(child.points[2]);
      return;
    case 2:
      MidPoint(parent.points[0], parent.points[1], child.points[0]);
      child.points[0] = WrapNormalize(child.points[0]);
      child.points[1] = parent.points[1];
      child.points[1] = WrapNormalize(child.points[1]);
      MidPoint(parent.points[1], parent.points[2], child.points[2]);
      child.points[2] = WrapNormalize(child.points[2]);
      return;
    case 3:
      MidPoint(parent.points[0], parent.points[2], child.points[0]);
      child.points[0] = WrapNormalize(child.points[0]);
      MidPoint(parent.points[1], parent.points[2], child.points[1]);
      child.points[1] = WrapNormalize(child.points[1]);
      child.points[2] = parent.points[2];
      child.points[2] = WrapNormalize(child.points[2]);
      return;
    default:
      LOG("ERROR: Invalid sub_index.");
  }
}

int8_t IndexToFace(const uint64_t index, Face& face, int8_t required_depth){
  return IndexToFace(index, &face, required_depth);
}

int8_t IndexToFace(const uint64_t index, Face* face, int8_t required_depth){
  //LOG("IndexToFace(" << index << "," << (int)required_depth << ")");
  if(required_depth > 30){
    LOG("WARNING: Invalid required_depth: " << required_depth );
    required_depth = 30;
  }

  if(!(face->status & Populated)){
    IndexToRootFace(index, face);
    face->status |= Populated;
  }
  int8_t depth = face->recursion;


  Face child_face;

  while(required_depth < 0 || required_depth > depth){
    if(required_depth < 0 && index << (3+ (depth*2)) == 0){
      // TODO: Test this special case.
      // (required_depth < 0) is a special case that stops the loop as soon as a
      // node with the same centre has been found.
      // Then shift all bits left so we ignore any bits addressing parents and
      // are left with bits addressing this level or children.
      // If we get here, all remaining bits are zero.
      break;
    }
    depth++;

    uint64_t sub_index = index >> (61 - (2 * depth));
    sub_index &= 3;

    FaceToSubface(sub_index, *face, child_face);
    std::swap(*face, child_face);
  }

  return depth;
}

/* Only works for faces of same recursion. */
uint8_t DoFacesTouch(const Face& face_1, const Face& face_2){
  uint8_t count_shared = 0;
  for(int i=0; i < 3; i++){
    for(int j=0; j < 3; j++){
      if(face_1.points[i] == face_2.points[j]){
        count_shared++;
      }
    }
  }
  return count_shared;
}

int8_t IsPointOnFace(const Face& face, const Point& point){
  for(uint8_t corner = 0; corner < 3; corner++){
    if(face.points[corner] == point){
      return corner;
    }
  }
  return -1;
}


/***** FaceCache *****/
std::shared_ptr<Face> FaceCache::Get(uint64_t index, int8_t recursion) {
  index = IndexAtRecursion(index, recursion);

  if (cache_.count(CacheKey(index, recursion))) {
    hits++;
    return cache_[CacheKey(index, recursion)];
  }
  misses++;
  return nullptr;
}

void FaceCache::Cache(std::shared_ptr<Face> face) { 
  cache_[CacheKey(face->index, face->recursion)] = face;
}

void FaceCache::Report(){
  LOG("hits: " << (long)hits << "\tmisses: " << (long)misses << "\tcontents: " << 
      (long)cache_.size());
}

void FaceCache::clean(unsigned long long oldest){
  LOG("Before clean: " << (long)cache_.size());
  std::vector<std::pair<uint64_t, int8_t>> delete_these;
  for(auto item : cache_){
    if(item.second->last_used < oldest){
      delete_these.emplace_back(item.first);
    }
  }
  for(auto key : delete_these){
    cache_.erase(cache_.find(key));
  }

  LOG("After clean:  " << (long)cache_.size());
}


/***** DataSourceGenerate *****/

std::shared_ptr<Face> DataSourceGenerate::getFace(const uint64_t index,
    const int8_t recursion, const uint8_t recurse_count) {
  std::shared_ptr<Face> p_face;
  if(cache_){
    p_face = cache_->Get(index, recursion);
  }
  if(!p_face){
    std::shared_ptr<Face> p_face_new(new Face);
    p_face = p_face_new;
    IndexToFace(index, *p_face, recursion);
    CalculateNeighbours(p_face);
    if(cache_){
      cache_->Cache(p_face);
    }
  }
  p_face->last_used = ++update_counter;
  SetHeight(p_face);

  // Make sure we don't do SetCornerHeights() if we are here as a recursive
  // part of another SetCornerHeights() call.
  if(!recurse_count){
    SetCornerHeights(p_face, recurse_count);
  }
  return p_face;
}

std::vector<std::shared_ptr<Face>> DataSourceGenerate::getFaces(
    const std::shared_ptr<Face> start_face, const int8_t required_depth)
{
  std::vector<std::shared_ptr<Face>> faces_in;
  std::vector<std::shared_ptr<Face>> faces_out;
  faces_in.push_back(start_face);

  for(int i = start_face->recursion; i < required_depth; i++){
    faces_out.clear();
    for(std::shared_ptr<Face> parent : faces_in) {
      for(uint8_t child : {0,1,2,3}){
        uint64_t child_index = IndexOfChild(parent->index, parent->recursion, child);
        std::shared_ptr<Face> child_face = getFace(child_index, parent->recursion +1);
        faces_out.push_back(child_face);
      }
    }
    std::swap(faces_in, faces_out);
  }
  if(cache_){
    cache_->Report();
  }
  return faces_in;
}

void DataSourceGenerate::SetHeight(std::shared_ptr<Face> face){
  if(face->status & BaseHeight){
    // Have already set height.
    return;
  }
  face->status |= BaseHeight;

  if(MinRecursionFromIndex(face->index) <= 2){
    /*if (myHash(face->index) < 0x80000000) {
      face->height = 1.5;
    } else {
      face->height = 0;
    }*/
    float height = (float)(myHash(face->index) % 0xFF) / 0x80;
    if(height < 1){
      height = 0;
    }
    face->height = height;
  } else if (MinRecursionFromIndex(face->index) > 2) {
    if(cache_){
      // Only doing this if cache is used.
      // Otherwise testing would take too long when when cache is disabled.

      float height_total = 0;
      for(auto neighbour : face->neighbours) {
        auto neighbour_parent_face = getFace(neighbour, face->recursion -1);
        height_total += neighbour_parent_face->height;
      }

      face->height = height_total / face->neighbours.size();
      //int16_t hashed = ((myHash(face->index) % 0x4F));
      int16_t hashed = ((myHash(face->index) % 0x4F)) - 0x1f;
      face->height -= (float)hashed / (face->recursion * face->recursion * face->recursion * face->recursion);
    }
  }
}

void DataSourceGenerate::SetCornerHeights(std::shared_ptr<Face> face, const uint8_t recurse_count){
  if(!cache_){
    // Only doing this if cache is used.
    // Otherwise testing would take too long when when cache is disabled.
    return;
  }

  if(face->status & Heights){
    // Already calculated.
    return;
  }

  std::array<uint8_t, 3> contributers;
  for(auto neighbour : face->neighbours)
  {
    auto neighbour_face = getFace(neighbour, face->recursion, recurse_count +1);
    for(uint8_t corner : {0,1,2}){
      if(IsPointOnFace(*neighbour_face, face->points[corner]) >= 0){
        face->heights[corner] += neighbour_face->height;
        contributers[corner]++;
      }
    }
  }
  for(uint8_t corner : {0,1,2}){
    face->heights[corner] += face->height;
    face->heights[corner] /= contributers[corner];
  }
  
  // Mark this section done.
  face->status |= Heights;
}

void DataSourceGenerate::CalculateNeighbours(std::shared_ptr<Face> face){
  if(face->status & Neighbours){
    // Already calculated.
    return;
  }
  face->status |= Neighbours;

  if (face->recursion == 0){
    for(uint64_t neighbour_index : k_root_node_indexes){
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
    for(int8_t child : {0,1,2,3}){
      std::shared_ptr<Face> child_face(new Face);
      FaceToSubface(child, *parent_face, *child_face);
      if(child_face->index == face->index){
        peers[child] = face;
      } else {
        peers[child] = child_face;
        if(cache_){
          cache_->Cache(peers[child]);
        }
      }
    }

    for(uint64_t neighbour : parent_face->neighbours) {
      std::shared_ptr<Face> neighbour_parent_face = getFace(neighbour, face->recursion -1);
      for(int8_t neighbour_child : {0,1,2,3}){
        // We deliberately don't use getFace() to look up faces on the same level
        // of recursion as getFace() calls this method which would lead to
        // exponential growth.
        Face neighbour_child_face;
        FaceToSubface(neighbour_child, *neighbour_parent_face, neighbour_child_face);

        for(int8_t child : {0,1,2,3}){
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
  }
}

std::shared_ptr<Face> DataSourceGenerate::pointToFace(const Point point, 
                                                      const uint8_t max_recursion)
{
  Face start_face;
  start_face.status = 0;
  return pointToSubFace(point, max_recursion, start_face);
}

std::shared_ptr<Face> DataSourceGenerate::pointToSubFace(const Point point, 
                                                      const uint8_t max_recursion,
                                                      Face& enclosing_face)
{
  if(!(enclosing_face.status & Populated) || (enclosing_face.recursion == 0)){
    // Even if we have a starting enclosing_face but recursion == 0 
    for(uint64_t root_index : k_root_node_indexes){
      Face root_face;
      IndexToRootFace(root_index, root_face);
      if(VectorCrossesFace(point, root_face)){
        if(!(enclosing_face.status & Populated)){
          std::swap(enclosing_face, root_face);
          root_face.status |= Populated;
        } else if (glm::distance2(point, root_face.points[0]) <
            glm::distance2(point, enclosing_face.points[0]))
        {
          std::swap(enclosing_face, root_face);
          break;
        }
      }
    }
  }

  for(uint8_t recursion = enclosing_face.recursion +1;
      recursion <= max_recursion; recursion++)
  {
    bool sucess = false;
    for(uint8_t child_id : {0,1,2,3}){
      Face child_face;
      FaceToSubface(child_id, enclosing_face, child_face);
      if(VectorCrossesFace(point, child_face)){
        std::swap(child_face, enclosing_face);
        sucess = true;
        break;
      }
    }
    if(!sucess){
      // The target was not inside the suggested enclosing_face.
      return pointToFace(point, max_recursion);
    }
  }

  LOG(std::hex << enclosing_face.index << std::dec);
  return getFace(enclosing_face.index, enclosing_face.recursion);
}



