package com.visualhoming

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class VisualHomingApp : Application() {
    
    companion object {
        const val TAG = "VisualHoming"
        
        // Default Pi connection settings
        const val DEFAULT_PI_HOST = "visual-homing.local"
        const val DEFAULT_PI_PORT = 5000
        
        // Hotspot settings
        const val HOTSPOT_SSID = "VisualHoming"
        const val HOTSPOT_PASSWORD = "drone12345"
    }
    
    override fun onCreate() {
        super.onCreate()
        // Initialize any app-wide components here
    }
}
