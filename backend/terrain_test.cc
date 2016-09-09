#include "terrain.cc"
#include "logging.cc"
#include "googletest/googletest/include/gtest/gtest.h"

namespace {

// The fixture for testing class Foo.
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
  Face face;

  face.points[0] = {4,8,0};
  face.points[1] = {8,0,0};
  face.points[2] = {0,0,0};
  FaceToSubface(0, face);
  ASSERT_EQ(face.points[0], Point({4,0,0}));
  ASSERT_EQ(face.points[1], Point({2,4,0}));
  ASSERT_EQ(face.points[2], Point({6,4,0}));

  face.points[0] = {4,8,0};
  face.points[1] = {8,0,0};
  face.points[2] = {0,0,0};
  FaceToSubface(1, face);
  ASSERT_EQ(face.points[0], Point({4,8,0}));
  ASSERT_EQ(face.points[1], Point({6,4,0}));
  ASSERT_EQ(face.points[2], Point({2,4,0}));

  face.points[0] = {4,8,0};
  face.points[1] = {8,0,0};
  face.points[2] = {0,0,0};
  FaceToSubface(2, face);
  ASSERT_EQ(face.points[0], Point({6,4,0}));
  ASSERT_EQ(face.points[1], Point({8,0,0}));
  ASSERT_EQ(face.points[2], Point({4,0,0}));
  
  face.points[0] = {4,8,0};
  face.points[1] = {8,0,0};
  face.points[2] = {0,0,0};
  FaceToSubface(3, face);
  ASSERT_EQ(face.points[0], Point({2,4,0}));
  ASSERT_EQ(face.points[1], Point({4,0,0}));
  ASSERT_EQ(face.points[2], Point({0,0,0}));

  face.points[0] = {0,4,8};
  face.points[1] = {0,8,0};
  face.points[2] = {0,0,0};
  FaceToSubface(0, face);
  ASSERT_EQ(face.points[0], Point({0,4,0}));
  ASSERT_EQ(face.points[1], Point({0,2,4}));
  ASSERT_EQ(face.points[2], Point({0,6,4}));

  face.points[0] = {0,4,8};
  face.points[1] = {0,8,0};
  face.points[2] = {0,0,0};
  FaceToSubface(1, face);
  ASSERT_EQ(face.points[0], Point({0,4,8}));
  ASSERT_EQ(face.points[1], Point({0,6,4}));
  ASSERT_EQ(face.points[2], Point({0,2,4}));

  face.points[0] = {0,4,8};
  face.points[1] = {0,8,0};
  face.points[2] = {0,0,0};
  FaceToSubface(2, face);
  ASSERT_EQ(face.points[0], Point({0,6,4}));
  ASSERT_EQ(face.points[1], Point({0,8,0}));
  ASSERT_EQ(face.points[2], Point({0,4,0}));
  
  face.points[0] = {0,4,8};
  face.points[1] = {0,8,0};
  face.points[2] = {0,0,0};
  FaceToSubface(3, face);
  ASSERT_EQ(face.points[0], Point({0,2,4}));
  ASSERT_EQ(face.points[1], Point({0,4,0}));
  ASSERT_EQ(face.points[2], Point({0,0,0}));

}

}  // namespace

int main(int argc, char **argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
