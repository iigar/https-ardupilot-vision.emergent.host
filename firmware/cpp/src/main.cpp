/**
 * Visual Homing System - Main Entry Point (C++ version)
 */

#include <iostream>
#include <signal.h>
#include <atomic>
#include <thread>
#include <chrono>

#include "camera.hpp"
#include "feature_tracker.hpp"
#include "visual_odometry.hpp"
#include "route_memory.hpp"
#include "mavlink_interface.hpp"

using namespace visual_homing;

std::atomic<bool> g_running{true};

void signalHandler(int signum) {
    std::cout << "Shutdown signal received" << std::endl;
    g_running = false;
}

int main(int argc, char** argv) {
    std::cout << "Visual Homing System (C++ version)" << std::endl;
    std::cout << "===================================" << std::endl;

    // Signal handlers
    signal(SIGINT, signalHandler);
    signal(SIGTERM, signalHandler);

    // Parse arguments
    std::string camera_device = "/dev/video0";
    std::string mavlink_port = "/dev/serial0";
    bool test_mode = false;

    for (int i = 1; i < argc; i++) {
        std::string arg = argv[i];
        if (arg == "--test-mode") {
            test_mode = true;
        } else if (arg == "--camera" && i + 1 < argc) {
            camera_device = argv[++i];
        } else if (arg == "--port" && i + 1 < argc) {
            mavlink_port = argv[++i];
        }
    }

    // Initialize components
    Camera camera(Camera::Type::USB_CAPTURE, camera_device);
    VisualOdometry vo(500);
    RouteMemory route_memory;
    MAVLinkInterface mavlink(mavlink_port);

    // Start camera
    if (!camera.start()) {
        std::cerr << "Failed to start camera" << std::endl;
        return 1;
    }

    // Connect MAVLink (optional in test mode)
    if (!test_mode) {
        if (!mavlink.connect()) {
            std::cerr << "MAVLink connection failed - running without FC" << std::endl;
        }
    }

    std::cout << "System started. Press Ctrl+C to stop." << std::endl;

    // Main loop
    cv::Mat frame;
    FrameInfo frame_info;
    int frame_count = 0;

    while (g_running) {
        if (camera.getFrame(frame, frame_info)) {
            frame_count++;

            // Get altitude from MAVLink
            double altitude = mavlink.isConnected() ?
                mavlink.getAltitude() : 1.0;
            if (altitude < 0.5) altitude = 0.5;

            // Update visual odometry
            vo.setAltitude(altitude);
            auto [pose, velocity] = vo.processFrame(frame, frame_info.timestamp);

            if (pose) {
                // Send to ArduPilot
                if (mavlink.isConnected()) {
                    mavlink.sendVisionPosition(
                        pose->x, pose->y, altitude,
                        0, 0, pose->yaw,
                        pose->confidence
                    );

                    if (velocity) {
                        mavlink.sendVisionSpeed(
                            velocity->vx, velocity->vy, velocity->vz
                        );
                    }
                }

                // Print status every 100 frames
                if (frame_count % 100 == 0) {
                    std::cout << "Pose: (" << pose->x << ", " << pose->y << ") "
                              << "Yaw: " << pose->yaw * 180 / 3.14159 << "deg "
                              << "Conf: " << pose->confidence << std::endl;
                }
            }
        }

        std::this_thread::sleep_for(std::chrono::milliseconds(5));
    }

    // Cleanup
    std::cout << "Shutting down..." << std::endl;
    camera.stop();
    mavlink.disconnect();

    std::cout << "Goodbye!" << std::endl;
    return 0;
}
