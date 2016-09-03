// Copyright 2016 duncan law (mrdunk@gmail.com)

#include "backend/terrain.h"

void Terrain::addDataSource(DataSourceBase *p_data_source) {
  // TODO(duncan): Add check for duplicate data_sources.
  data_sources_.push_back(p_data_source);
}

std::shared_ptr<Face> Terrain::getFace(uint64_t index) {
  std::shared_ptr<Face> p_face;
  for (std::vector<DataSourceBase *>::iterator it = data_sources_.begin();
       it != data_sources_.end(); ++it)
  {
    if (p_face->populated) {
      // Already have data so see if other methods want a copy to cache.
      (*it)->cacheFace(index, p_face);
    } else {
      p_face = (*it)->getFace(index);
    }
  }
  return p_face;
}

void IndexToBiggestFace(uint64_t index, Face& face){
  index &= k_top_level_mask;
  index = index >> 61;
  face.points[0].x = parent_faces[index][0][0];
  face.points[0].y = parent_faces[index][0][1];
  face.points[0].z = parent_faces[index][0][2];
  face.points[1].x = parent_faces[index][1][0];
  face.points[1].y = parent_faces[index][1][1];
  face.points[1].z = parent_faces[index][1][2];
  face.points[2].x = parent_faces[index][2][0];
  face.points[2].y = parent_faces[index][2][1];
  face.points[2].z = parent_faces[index][2][2];
}

void MidPoint(const Point a, const Point b, Point& mid){
  mid.x = (a.x / 2) + (b.x / 2);
  mid.y = (a.y / 2) + (b.y / 2);
  mid.z = (a.z / 2) + (b.z / 2);
}

void FaceToSubface(uint8_t index, Face& face){
  Face sub_face;
  sub_face.populated = true;
  switch(index){
    case 0:
      MidPoint(face.points[1], face.points[2], sub_face.points[0]);
      MidPoint(face.points[0], face.points[2], sub_face.points[1]);
      MidPoint(face.points[0], face.points[1], sub_face.points[2]);
      face = sub_face;
      return;
    case 1:
      sub_face.points[0] = face.points[0];
      MidPoint(face.points[0], face.points[1], sub_face.points[1]);
      MidPoint(face.points[0], face.points[2], sub_face.points[2]);
      face = sub_face;
      return;
    case 2:
      MidPoint(face.points[0], face.points[1], sub_face.points[0]);
      sub_face.points[1] = face.points[1];
      MidPoint(face.points[1], face.points[2], sub_face.points[2]);
      face = sub_face;
      return;
    case 3:
      MidPoint(face.points[0], face.points[2], sub_face.points[0]);
      MidPoint(face.points[1], face.points[2], sub_face.points[1]);
      sub_face.points[2] = face.points[2];
      face = sub_face;
      return;
    default:
      LOG("ERROR: Invalid index.");
  }
}

int8_t IndexToFace(uint64_t index, Face& face, int8_t required_depth){
  int8_t depth = 0;
  if(required_depth < 0 || required_depth > 30){
    required_depth = 30;
  }

  if(!face.populated){
    IndexToBiggestFace(index, face);
    face.populated = true;
  }

  while(required_depth <= depth){
    if(index << (3+ (depth*2)) == 0){
      // All remaining bits are zero.
      break;
    }

    uint64_t sub_index = index >> (61 - (2 * depth));
    sub_index &= 3;
    FaceToSubface(sub_index, face);
    depth++;
  }

  return depth;
}

int8_t IndexToFace(uint64_t index, Face& face){
  return IndexToFace(index, face, -1);
}


