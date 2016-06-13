#include "terrain.h"

void Terrain::addDataSource(DataSourceBase* p_data_source) {
  // TODO Add check for duplicate data_sources.
  data_sources_.push_back(p_data_source);
}

Face Terrain::getFace(uint64_t index) {
  Face Face;
  for (std::vector<DataSourceBase*>::iterator it = data_sources_.begin() ;
       it != data_sources_.end(); ++it){
    if (Face.isPopulated()) {
      // Already have data so see if other methods want a copy to cache.
      (*it)->cacheFace(index, Face);
    } else {
      Face = (*it)->getFace(index);
    }
  }
  return Face;
}