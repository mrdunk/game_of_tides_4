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
  parent.recursion = 0;
  FaceToSubface(0, parent, child);
  ASSERT_EQ(child.points[0], Point({4,0,0}));
  ASSERT_EQ(child.points[1], Point({2,4,0}));
  ASSERT_EQ(child.points[2], Point({6,4,0}));
  ASSERT_EQ(child.recursion, 1);

  parent.points[0] = {4,8,0};
  parent.points[1] = {8,0,0};
  parent.points[2] = {0,0,0};
  parent.recursion = 0;
  FaceToSubface(1, parent, child);
  ASSERT_EQ(child.points[0], Point({4,8,0}));
  ASSERT_EQ(child.points[1], Point({6,4,0}));
  ASSERT_EQ(child.points[2], Point({2,4,0}));
  ASSERT_EQ(child.recursion, 1);

  parent.points[0] = {4,8,0};
  parent.points[1] = {8,0,0};
  parent.points[2] = {0,0,0};
  parent.recursion = 0;
  FaceToSubface(2, parent, child);
  ASSERT_EQ(child.points[0], Point({6,4,0}));
  ASSERT_EQ(child.points[1], Point({8,0,0}));
  ASSERT_EQ(child.points[2], Point({4,0,0}));
  ASSERT_EQ(child.recursion, 1);
  
  parent.points[0] = {4,8,0};
  parent.points[1] = {8,0,0};
  parent.points[2] = {0,0,0};
  parent.recursion = 0;
  FaceToSubface(3, parent, child);
  ASSERT_EQ(child.points[0], Point({2,4,0}));
  ASSERT_EQ(child.points[1], Point({4,0,0}));
  ASSERT_EQ(child.points[2], Point({0,0,0}));
  ASSERT_EQ(child.recursion, 1);

  parent.points[0] = {0,4,8};
  parent.points[1] = {0,8,0};
  parent.points[2] = {0,0,0};
  parent.recursion = 0;
  FaceToSubface(0, parent, child);
  ASSERT_EQ(child.points[0], Point({0,4,0}));
  ASSERT_EQ(child.points[1], Point({0,2,4}));
  ASSERT_EQ(child.points[2], Point({0,6,4}));
  ASSERT_EQ(child.recursion, 1);

  parent.points[0] = {0,4,8};
  parent.points[1] = {0,8,0};
  parent.points[2] = {0,0,0};
  parent.recursion = 0;
  FaceToSubface(1, parent, child);
  ASSERT_EQ(child.points[0], Point({0,4,8}));
  ASSERT_EQ(child.points[1], Point({0,6,4}));
  ASSERT_EQ(child.points[2], Point({0,2,4}));
  ASSERT_EQ(child.recursion, 1);

  parent.points[0] = {0,4,8};
  parent.points[1] = {0,8,0};
  parent.points[2] = {0,0,0};
  parent.recursion = 0;
  FaceToSubface(2, parent, child);
  ASSERT_EQ(child.points[0], Point({0,6,4}));
  ASSERT_EQ(child.points[1], Point({0,8,0}));
  ASSERT_EQ(child.points[2], Point({0,4,0}));
  ASSERT_EQ(child.recursion, 1);
  
  parent.points[0] = {0,4,8};
  parent.points[1] = {0,8,0};
  parent.points[2] = {0,0,0};
  parent.recursion = 0;
  FaceToSubface(3, parent, child);
  ASSERT_EQ(child.points[0], Point({0,2,4}));
  ASSERT_EQ(child.points[1], Point({0,4,0}));
  ASSERT_EQ(child.points[2], Point({0,0,0}));
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


}  // namespace

int main(int argc, char **argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
