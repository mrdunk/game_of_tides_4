CXX=g++
CXXFLAGS=-Wall -std=c++11 -D_WEBSOCKETPP_CPP11_STL_
LDFLAGS=
LDLIBS=-lssl -lcrypto -lpthread
INCLUDES=-I./ -I../
SOURCES=$(wildcard *.cc)
OBJECTS=$(SOURCES:.cc=.o)
MODIFIED_OBJECTS=$(patsubst %.o,$(BUILD_DIR)%.o,$(OBJECTS))
BUILD_DIR=build/

# Options to build dependecy files for tracking .h files.
DEPFLAGS = -MT $@ -MMD -MP -MF $(BUILD_DIR)$*.Td
DEP=$(MODIFIED_OBJECTS:.o=.d)
VPATH=build/

EXECUTABLE=backend

$(shell mkdir -p $(BUILD_DIR) >/dev/null)

all: $(OBJECTS) $(EXECUTABLE)

# Source dependecy files to see if addnything other than one of the SOURCES has changed.
# Note, this must be done after all:
-include $(DEP)

%.o: %.cc
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< $(DEPFLAGS) -o $(BUILD_DIR)$@
	mv -f $(BUILD_DIR)$*.Td $(BUILD_DIR)$*.d

$(EXECUTABLE): $(OBJECTS)
	$(CXX) $(CXXFLAGS) $(LDFLAGS) $(MODIFIED_OBJECTS) $(LDLIBS) -o $(BUILD_DIR)$@

clean :
	rm -f $(MODIFIED_OBJECTS) $(BUILD_DIR)$(EXECUTABLE) $(DEP)
