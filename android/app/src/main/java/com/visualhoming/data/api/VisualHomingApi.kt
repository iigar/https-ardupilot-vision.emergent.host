package com.visualhoming.data.api

import retrofit2.http.*

/**
 * Visual Homing API Client
 * Communicates with Raspberry Pi running Visual Homing firmware
 */
interface VisualHomingApi {
    
    companion object {
        const val DEFAULT_BASE_URL = "http://visual-homing.local:5000"
    }
    
    // Health & Status
    @GET("/api/health")
    suspend fun healthCheck(): HealthResponse
    
    @GET("/api/")
    suspend fun getApiInfo(): ApiInfoResponse
    
    // Telemetry
    @GET("/api/telemetry")
    suspend fun getTelemetry(): TelemetryResponse
    
    @GET("/api/sensors/status")
    suspend fun getSensorsStatus(): SensorsStatusResponse
    
    // Smart RTL
    @GET("/api/smart-rtl/status")
    suspend fun getSmartRtlStatus(): SmartRtlStatusResponse
    
    @POST("/api/return/start")
    suspend fun startReturn(): ApiResponse
    
    @POST("/api/return/stop")
    suspend fun stopReturn(): ApiResponse
    
    // Routes
    @GET("/api/routes")
    suspend fun getRoutes(): List<RouteResponse>
    
    @GET("/api/routes/{routeId}")
    suspend fun getRoute(@Path("routeId") routeId: String): RouteResponse
    
    @POST("/api/routes/demo/generate")
    suspend fun generateDemoRoute(): RouteResponse
    
    @GET("/api/routes/{routeId}/export/json")
    suspend fun exportRouteJson(@Path("routeId") routeId: String): RouteResponse
    
    // Settings
    @GET("/api/settings")
    suspend fun getSettings(): SettingsResponse
    
    @POST("/api/settings")
    suspend fun saveSettings(@Body settings: SettingsRequest): ApiResponse
    
    // Stream
    @GET("/api/stream/status")
    suspend fun getStreamStatus(): StreamStatusResponse
}

// Response models
data class HealthResponse(
    val status: String,
    val timestamp: String
)

data class ApiInfoResponse(
    val message: String,
    val version: String
)

data class ApiResponse(
    val success: Boolean,
    val message: String? = null
)

data class TelemetryResponse(
    val altitude: Float,
    val speed: Float,
    val heading: Float,
    val battery: Int,
    val satellites: Int,
    val homeDistance: Float
)

data class SensorsStatusResponse(
    val opticalFlow: SensorStatus,
    val lidar: SensorStatus,
    val camera: SensorStatus,
    val mavlink: SensorStatus
)

data class SensorStatus(
    val connected: Boolean,
    val name: String,
    val details: String? = null
)

data class SmartRtlStatusResponse(
    val active: Boolean,
    val phase: String,
    val currentAltitude: Float,
    val homeDistance: Float,
    val returnProgress: Float,
    val navSource: String,
    val targetAltitude: Float
)

data class RouteResponse(
    val id: String,
    val name: String,
    val points: List<RoutePoint>,
    val keyframes: List<RoutePoint>,
    val totalDistance: Float,
    val createdAt: String
)

data class RoutePoint(
    val x: Float,
    val y: Float,
    val z: Float,
    val yaw: Float,
    val timestamp: Float,
    val isKeyframe: Boolean
)

data class SettingsResponse(
    val autostart: Boolean,
    val cameraDevice: String,
    val cameraFps: Int,
    val cameraResolutionW: Int,
    val cameraResolutionH: Int,
    val streamEnabled: Boolean,
    val streamUrl: String,
    val cameraType: String,
    val smartRtlAltitudeThreshold: Float,
    val smartRtlReturnSpeed: Float
)

data class SettingsRequest(
    val autostart: Boolean? = null,
    val cameraType: String? = null,
    val cameraFps: Int? = null,
    val streamEnabled: Boolean? = null,
    val smartRtlAltitudeThreshold: Float? = null,
    val smartRtlReturnSpeed: Float? = null
)

data class StreamStatusResponse(
    val available: Boolean,
    val url: String,
    val type: String
)
