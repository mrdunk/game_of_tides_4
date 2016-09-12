#include "terrain.cc"
#include "logging.cc"
#include "gtest/gtest.h"

namespace {

class GeneralFunctionsTest : public ::testing::Test {
 protected:
  // You can remove any or all of the following functions if its body
  // is empty.

  GeneralFunctionsTest() {
    // You can do set-up work for each test here.
  }

  virtual ~GeneralFunctionsTest() {
    // You can do clean-up work that doesn't throw exceptions here.
  }

  // If the constructor and destructor are not enough for setting up
  // and cleaning up each test, you can define the following methods:

  virtual void SetUp() {
    // Code here will be called immediately after the constructor (right
    // before each test).
  }

  virtual void TearDown() {
    // Code here will be called immediately after each test (right
    // before the destructor).
  }

  // Objects declared here can be used by all tests in the test case for Foo.
};

TEST_F(GeneralFunctionsTest, MinRecursionFromIndex) {
  ASSERT_EQ(MinRecursionFromIndex((uint64_t)k_top_level_mask), 0);
  ASSERT_EQ(MinRecursionFromIndex(0), 0);
  ASSERT_EQ(MinRecursionFromIndex((uint64_t)1 << 61), 0);
  ASSERT_EQ(MinRecursionFromIndex((uint64_t)2 << 61), 0);
  ASSERT_EQ(MinRecursionFromIndex((uint64_t)3 << 61), 0);
  ASSERT_EQ(MinRecursionFromIndex((uint64_t)4 << 61), 0);
  ASSERT_EQ(MinRecursionFromIndex((uint64_t)5 << 61), 0);
  ASSERT_EQ(MinRecursionFromIndex((uint64_t)6 << 61), 0);
  ASSERT_EQ(MinRecursionFromIndex((uint64_t)7 << 61), 0);

  ASSERT_EQ(MinRecursionFromIndex((uint64_t)1 << 59), 1);
  ASSERT_EQ(MinRecursionFromIndex((uint64_t)2 << 59), 1);
  ASSERT_EQ(MinRecursionFromIndex((uint64_t)3 << 59), 1);
  ASSERT_EQ(MinRecursionFromIndex((uint64_t)1 << 57), 2);
  ASSERT_EQ(MinRecursionFromIndex((uint64_t)2 << 57), 2);
  ASSERT_EQ(MinRecursionFromIndex((uint64_t)3 << 57), 2);
}

TEST_F(GeneralFunctionsTest, PointEqualPoint) {
  Point point1 = {4,8,0};
  Point point2 = {2,4,6};
  ASSERT_EQ(point1, point1);
  ASSERT_NE(point1, point2);
}

TEST_F(GeneralFunctionsTest, FaceToSubface) {
  Face parent;
  Face child;

  parent.points[0] = {4,8,0};
  parent.points[1] = {8,0,0};
  parent.points[2] = {0,0,0};
  parent.index = (uint64_t)7 << 61;
  parent.recursion = 0;
  FaceToSubface(0, parent, child);
  ASSERT_EQ(child.points[0], Point({4,0,0}));
  ASSERT_EQ(child.points[1], Point({2,4,0}));
  ASSERT_EQ(child.points[2], Point({6,4,0}));
  ASSERT_EQ(child.index, ((uint64_t)7 << 61) + ((uint64_t)0 << 59));
  ASSERT_EQ(child.recursion, 1);
  
  parent.points[0] = {4,8,0};
  parent.points[1] = {8,0,0};
  parent.points[2] = {0,0,0};
  parent.index = (uint64_t)7 << 61;
  parent.recursion = 0;
  FaceToSubface(3, parent, child);
  ASSERT_EQ(child.points[0], Point({2,4,0}));
  ASSERT_EQ(child.points[1], Point({4,0,0}));
  ASSERT_EQ(child.points[2], Point({0,0,0}));
  ASSERT_EQ(child.index, ((uint64_t)7 << 61) + ((uint64_t)3 << 59));
  ASSERT_EQ(child.recursion, 1);

  parent.points[0] = {0,4,8};
  parent.points[1] = {0,8,0};
  parent.points[2] = {0,0,0};
  parent.index = (uint64_t)7 << 61;
  parent.recursion = 0;
  FaceToSubface(0, parent, child);
  ASSERT_EQ(child.points[0], Point({0,4,0}));
  ASSERT_EQ(child.points[1], Point({0,2,4}));
  ASSERT_EQ(child.points[2], Point({0,6,4}));
  ASSERT_EQ(child.index, ((uint64_t)7 << 61) + ((uint64_t)0 << 59));
  ASSERT_EQ(child.recursion, 1);

  parent.points[0] = {0,4,8};
  parent.points[1] = {0,8,0};
  parent.points[2] = {0,0,0};
  parent.index = (uint64_t)7 << 61;
  parent.recursion = 0;
  FaceToSubface(3, parent, child);
  ASSERT_EQ(child.points[0], Point({0,2,4}));
  ASSERT_EQ(child.points[1], Point({0,4,0}));
  ASSERT_EQ(child.points[2], Point({0,0,0}));
  ASSERT_EQ(child.index, ((uint64_t)7 << 61) + ((uint64_t)3 << 59));
  ASSERT_EQ(child.recursion, 1);
}


class DataSourceGenerateTest : public ::testing::Test {
 protected:
  DataSourceGenerateTest() {
    // You can do set-up work for each test here.
  }

  DataSourceGenerate data_generator;
};

TEST_F(DataSourceGenerateTest, GetFaceRootFaces) {
  // The "0"th root face.
  std::shared_ptr<Face> face = data_generator.getFace(0);
  ASSERT_NE(face->points[0], face->points[1]);
  ASSERT_NE(face->points[0], face->points[2]);
  ASSERT_NE(face->points[1], face->points[2]);

  ASSERT_EQ(
      glm::distance(glm::vec3(face->points[0]), glm::vec3(face->points[1])),
      glm::distance(glm::vec3(face->points[0]), glm::vec3(face->points[2])));
  ASSERT_EQ(
      glm::distance(glm::vec3(face->points[1]), glm::vec3(face->points[0])),
      glm::distance(glm::vec3(face->points[1]), glm::vec3(face->points[2])));
  ASSERT_EQ(
      glm::distance(glm::vec3(face->points[2]), glm::vec3(face->points[0])),
      glm::distance(glm::vec3(face->points[2]), glm::vec3(face->points[1])));

  // The 4th root face. (There are 8 total. 0-7.)
  face = data_generator.getFace((uint64_t)4 << 61);
  ASSERT_NE(face->points[0], face->points[1]);
  ASSERT_NE(face->points[0], face->points[2]);
  ASSERT_NE(face->points[1], face->points[2]);

  ASSERT_EQ(
      glm::distance(glm::vec3(face->points[0]), glm::vec3(face->points[1])),
      glm::distance(glm::vec3(face->points[0]), glm::vec3(face->points[2])));
  ASSERT_EQ(
      glm::distance(glm::vec3(face->points[1]), glm::vec3(face->points[0])),
      glm::distance(glm::vec3(face->points[1]), glm::vec3(face->points[2])));
  ASSERT_EQ(
      glm::distance(glm::vec3(face->points[2]), glm::vec3(face->points[0])),
      glm::distance(glm::vec3(face->points[2]), glm::vec3(face->points[1])));
}

TEST_F(DataSourceGenerateTest, MidPoint) {
  // There are 8 root starting faces.
  for(int8_t index = 0; index < 8; index++){
    Face face;
    // We can index a maximum depth of 30 bits.
    for(int8_t depth=0; depth <= 30; depth++){  
      IndexToFace(index, face, depth);
      ASSERT_EQ(face.recursion, depth);
      
      Point mid;

      MidPoint(face.points[0], face.points[1], mid);
      ASSERT_NE(face.points[0], face.points[1]);
      ASSERT_NE(face.points[0], mid);
      ASSERT_NE(face.points[1], mid);
      ASSERT_EQ(face.points[0].x/2 + face.points[1].x/2,
                mid.x);
      ASSERT_EQ(face.points[0].y/2 + face.points[1].y/2,
                mid.y);
      ASSERT_EQ(face.points[0].z/2 + face.points[1].z/2,
                mid.z);
      //LOG((double)glm::distance(face.points[0], mid));
      ASSERT_NEAR(glm::distance(face.points[0], mid),
                glm::distance(face.points[1], mid),
                0.1);
      
      MidPoint(face.points[0], face.points[2], mid);
      ASSERT_NE(face.points[0], face.points[2]);
      ASSERT_NE(face.points[0], mid);
      ASSERT_NE(face.points[2], mid);
      ASSERT_EQ(face.points[0].x/2 + face.points[2].x/2,
                mid.x);
      ASSERT_EQ(face.points[0].y/2 + face.points[2].y/2,
                mid.y);
      ASSERT_EQ(face.points[0].z/2 + face.points[2].z/2,
                mid.z);
      //LOG((double)glm::distance(face.points[0], mid));
      ASSERT_NEAR(glm::distance(face.points[0], mid),
                glm::distance(face.points[2], mid),
                0.1);
      
      MidPoint(face.points[1], face.points[2], mid);
      ASSERT_NE(face.points[1], face.points[2]);
      ASSERT_NE(face.points[1], mid);
      ASSERT_NE(face.points[2], mid);
      ASSERT_EQ(face.points[1].x/2 + face.points[2].x/2,
                mid.x);
      ASSERT_EQ(face.points[1].y/2 + face.points[2].y/2,
                mid.y);
      ASSERT_EQ(face.points[1].z/2 + face.points[2].z/2,
                mid.z);
      //LOG((double)glm::distance(face.points[2], mid));
      ASSERT_NEAR(glm::distance(face.points[1], mid),
                glm::distance(face.points[2], mid),
                0.1);
    }
  }
}

TEST_F(DataSourceGenerateTest, IndexToFace) {
  std::shared_ptr<Face> face(new Face);
  IndexToFace(0, face.get(), 0);
  float size_of_parent = glm::distance(face->points[0],
                                   face->points[1]);
  float size_of_child;
  std::vector<std::shared_ptr<Face>> faces;

  for(int8_t recursion=1; recursion <= 30; recursion++){
    IndexToFace(0, face.get(), recursion);
    size_of_child = glm::distance(face->points[0],
                                  face->points[1]);
    
    ASSERT_NEAR(size_of_parent/2, size_of_child, 0.001);
    ASSERT_EQ(face->recursion, recursion);
    ASSERT_GT(size_of_parent, 0);
    size_of_parent = size_of_child;
  }
}

TEST_F(DataSourceGenerateTest, GetFaceChildFaces) {
  // The "0"th root face.
  std::shared_ptr<Face> face = data_generator.getFace(0);
  float size_of_root = glm::distance(glm::vec3(face->points[0]),
                                     glm::vec3(face->points[1]));
  
  // The 1th child of the 0th root. (0-3 children. 0-7 roots.)
  face = data_generator.getFace((uint64_t)1 << 59);
  ASSERT_EQ(
      glm::distance(glm::vec3(face->points[0]), glm::vec3(face->points[1])),
      size_of_root / 2);

  // 3rd grandchild.
  face = data_generator.getFace((uint64_t)3 << 57);  
  ASSERT_EQ(
      glm::distance(glm::vec3(face->points[0]), glm::vec3(face->points[1])),
      size_of_root / 4);
}

TEST_F(DataSourceGenerateTest, GetFaceDepth) {
  // The "0"th root face.
  std::shared_ptr<Face> root_face = data_generator.getFace(0);
  float size_of_root = glm::distance(glm::vec3(root_face->points[0]),
                                     glm::vec3(root_face->points[1]));
  
  // Same position as the 0th root node but smaller resolution.
  std::shared_ptr<Face> face = data_generator.getFace(0, 2);
  ASSERT_EQ(
      glm::distance(glm::vec3(face->points[0]), glm::vec3(face->points[1])),
      size_of_root / 4);

  // A child exists 1 level of recursion down but we have requested 2.
  face = data_generator.getFace((uint64_t)1 << 59, 2);
  ASSERT_EQ(
      glm::distance(glm::vec3(face->points[0]), glm::vec3(face->points[1])),
      size_of_root / 4);

  // Although the address specifies a node some levels down, the recursion is
  // set to the top level so this should return a root node.
  face = data_generator.getFace((uint64_t)1 << 57, 0);
  ASSERT_EQ(*face, *root_face);
}

TEST_F(DataSourceGenerateTest, GetFaces) {
  std::shared_ptr<Face> root_face(new Face);
  IndexToRootFace(0, root_face.get());
  double size_of_root = glm::distance(root_face->points[0],
                                     root_face->points[1]);

  ASSERT_GT(size_of_root, 0);

  std::vector<std::shared_ptr<Face>> faces = data_generator.getFaces(root_face, 1);
  ASSERT_EQ(faces.size(), 4);

  // Check the children 2 layers down are quarter the size of the top layer.
  faces = data_generator.getFaces(root_face, 2);
  ASSERT_EQ(faces.size(), 16);

  ASSERT_NEAR(size_of_root / 4,
      glm::distance((*faces.begin())->points[0], (*faces.begin())->points[1]),
      0.001);

  ASSERT_NEAR(size_of_root / 4,
      glm::distance((*faces.rbegin())->points[0], (*faces.rbegin())->points[1]),
      0.001);

  // What if we ask for children on the same layer?
  faces = data_generator.getFaces(root_face, 0);
  // Return the input face.
  ASSERT_EQ(faces.size(), 1);
}

TEST_F(DataSourceGenerateTest, GetFacesDeeper) {
  // Try getFaces() starting from non-root face.
  std::shared_ptr<Face> face(new Face);
  IndexToFace(0, face.get(), 0);
  double size_of_parent = glm::distance(face->points[0], face->points[1]);
  double size_of_child;
  std::vector<std::shared_ptr<Face>> faces;

  for(int8_t i=1; i <= 30; i++){
    faces = data_generator.getFaces(face, i);
    ASSERT_EQ(faces.size(), 4);
    face = faces[1];
    ASSERT_EQ(face->recursion, i);

    size_of_child = glm::distance(face->points[0], face->points[1]);
    ASSERT_NEAR(size_of_parent/2, size_of_child, 0.001);
    size_of_parent = size_of_child;
  }

}


}  // namespace

int main(int argc, char **argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
