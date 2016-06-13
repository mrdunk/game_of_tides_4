#include <iostream>
#include "terrain.h"

int main() {
  std::cout << "Hello World!" << std::endl;
  std::cout << k_top_level_mask << std::endl;
  
  Terrain terrain;
  DataSourceGenerate generator;
  terrain.addDataSource(&generator);
  
  std::cout << generator.getRecursionFromIndex(k_top_level_mask)  << std::endl;
  std::cout << generator.getRecursionFromIndex(0)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)1 << 61)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)2 << 61)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)3 << 61)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)4 << 61)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)5 << 61)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)6 << 61)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)7 << 61)  << std::endl;

  std::cout << generator.getRecursionFromIndex((uint64_t)1 << 60)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)1 << 59)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)1 << 58)  << std::endl;
  std::cout << generator.getRecursionFromIndex((uint64_t)1 << 57)  << std::endl;
  
}
