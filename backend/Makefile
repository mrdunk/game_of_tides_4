CXX=g++
CXXFLAGS=-Wall -std=c++11 -D_WEBSOCKETPP_CPP11_STL_ # -g
LDFLAGS=
LDLIBS=-lssl -lcrypto -lpthread
INCLUDES=-I./ -I../
SOURCES=$(wildcard *.cc)
SOURCES:=$(filter-out %_test.cc, $(SOURCES))
SOURCES_TEST=$(wildcard *_test.cc)
OBJECTS=$(SOURCES:.cc=.o)
OBJECTS_TEST=$(SOURCES_TEST:.cc=.o)
MODIFIED_OBJECTS=$(OBJECTS:%.o=$(BUILD_DIR)%.o)
MODIFIED_OBJECTS_TEST=$(OBJECTS_TEST:%.o=$(BUILD_DIR)tests/%.o)
BUILD_DIR=build/

# Options to build dependency files for tracking .h files.
DEPFLAGS = -MT $@ -MMD -MP -MF $(BUILD_DIR)$*.Td
DEP=$(MODIFIED_OBJECTS:.o=.d)
VPATH=build/

EXECUTABLE=backend

GTEST_DIR=googletest/googletest

$(shell mkdir -p $(BUILD_DIR) >/dev/null)

all: $(OBJECTS) $(EXECUTABLE)

# Source dependency files to see if anything other than one of the SOURCES has changed.
# Note, this must be done after all:
-include $(DEP)

$(info SOURCES: $(SOURCES))
$(info OBJECTS: $(OBJECTS))
$(info SOURCES_TEST: $(SOURCES_TEST))
$(info OBJECTS_TEST: $(OBJECTS_TEST))


$(OBJECTS): %.o: %.cc
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< $(DEPFLAGS) -o $(BUILD_DIR)$@
	mv -f $(BUILD_DIR)$*.Td $(BUILD_DIR)$*.d

$(EXECUTABLE): $(OBJECTS)
	$(CXX) $(CXXFLAGS) $(LDFLAGS) $(MODIFIED_OBJECTS) $(LDLIBS) -o $(BUILD_DIR)$@

$(OBJECTS_TEST): %.o: %.cc
	$(CXX) -isystem $(CXXFLAGS) $(INCLUDES) -I$(GTEST_DIR)/include -pthread $< \
    $(BUILD_DIR)test_lib/libgtest.a -o $(BUILD_DIR)tests/$*

.PHONY : clean
clean :
	rm -f $(MODIFIED_OBJECTS) $(BUILD_DIR)$(EXECUTABLE) $(DEP)
	rm -rf $(BUILD_DIR)test_lib/
	rm -rf $(BUILD_DIR)tests/

.PHONY : test_lib
test_lib : mkdir
	g++ -isystem $(GTEST_DIR)/include -I$(GTEST_DIR) -pthread \
    -c $(GTEST_DIR)/src/gtest-all.cc -o $(BUILD_DIR)test_lib/gtest-all.o
	ar -rv $(BUILD_DIR)test_lib/libgtest.a $(BUILD_DIR)test_lib/gtest-all.o

.PHONY : test
test: mkdir test_lib $(OBJECTS_TEST)

.PHONY : mkdir
mkdir:
	mkdir -p $(BUILD_DIR)test_lib/
	mkdir -p $(BUILD_DIR)tests
