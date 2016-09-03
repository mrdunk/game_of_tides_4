// Copyright 2016 duncan law (mrdunk@gmail.com)

#ifndef BACKEND_LOGGING_H_
#define BACKEND_LOGGING_H_

#include <mutex>          // std::mutex
#include <iostream>

extern std::mutex log_lock;
#define LOG(msg) log_lock.lock(); \
                 std::cout << __FILE__ << "(" << __LINE__ << "): " << \
                 msg << std::endl; \
                 log_lock.unlock()

#endif  // BACKEND_LOGGING_H_
