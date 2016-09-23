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
  face->populated = true;
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
  /*mid.x = (a.x + b.x) / 2;
  mid.y = (a.y + b.y) / 2;
  mid.z = (a.z + b.z) / 2;*/
}

/* Return the index of a sub face from a face. */
inline uint64_t IndexOfSubFace(const uint64_t index, const int8_t recursion, 
                        const uint64_t sub_index)
{
  return index + (sub_index << (61 - (2 * (recursion +1))));
}

inline Point WrapNormalize(const Point input){
#ifdef UNIT_TESTING
  return input;
#else
  return glm::normalize(input);
#endif  // UNIT_TESTING
}

void FaceToSubface(const uint8_t sub_index, Face parent, Face& child){
  child.index = IndexOfSubFace(parent.index, parent.recursion, sub_index);
  child.recursion = parent.recursion +1;
  child.populated = true;
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

  if(!face->populated){
    IndexToRootFace(index, face);
    face->populated = true;
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

int8_t GetNeighbours(const uint64_t target_index, int8_t target_recursion,
                   uint64_t* neighbours){
  Face target_face;
  int8_t neighbour_count;

  for(int8_t recursion = 0; recursion <= target_recursion; recursion++){
    neighbour_count = 0;
    if (recursion == 0){
      IndexToFace(target_index, &target_face, recursion);
      for(uint8_t root_index = 0; root_index < 8; root_index++){
        uint64_t index = (uint64_t)root_index << 61;
        Face neighbour_face;
        IndexToFace(index, neighbour_face, 0);
        
        if(DoFacesTouch(target_face, neighbour_face) == 2){
          neighbours[neighbour_count++] = index;
        }
      }
    } else {
      uint64_t sub_index = target_index >> (61 - (2 * recursion));
      sub_index &= 3;
      if (sub_index == 0) {
        // Center child is easy; It's neighbours are the other children of the
        // same parent.
        for(int64_t child = 1; child < 4; child++){
          neighbours[neighbour_count++] = target_index + (child << (61 - (2 * recursion)));
        }
      } else {
        uint64_t new_neighbours[3];
        IndexToFace(target_index, &target_face, recursion);
        for(int8_t neighbour = 0; neighbour < 3; neighbour++){
          // The target will only ever be next to a child at the edge of a
          // neighbour. (ie, not the center one indexed "0".)
          for(int8_t neighbour_child = 1; neighbour_child < 4; neighbour_child++){
            Face neighbour_parent_face, neighbour_child_face;

            IndexToFace(neighbours[neighbour], neighbour_parent_face, recursion -1);
            FaceToSubface(neighbour_child, neighbour_parent_face, neighbour_child_face);

            if(DoFacesTouch(target_face, neighbour_child_face) == 2){
              new_neighbours[neighbour_count++] = neighbour_child_face.index;
              break;
            }
          }
          if(neighbour_count >= 2){
            break;
          }
        }

        // Index of the center face of the parent face.
        new_neighbours[neighbour_count++] = 
          target_index & ~((int64_t)3 << (61 - (2 * recursion)));

        assert(neighbour_count == 3);
        neighbours[0] = new_neighbours[0];
        neighbours[1] = new_neighbours[1];
        neighbours[2] = new_neighbours[2];
      }
    }
  }
  return neighbour_count;
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



