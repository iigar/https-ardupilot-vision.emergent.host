package com.visualhoming.data.repository

import com.visualhoming.data.api.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class VisualHomingRepository @Inject constructor() {
    
    private var api: VisualHomingApi? = null
    private var baseUrl: String = "http://visual-homing.local:5000"
    
    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .build()
    
    fun setBaseUrl(url: String) {
        baseUrl = url
        api = Retrofit.Builder()
            .baseUrl(url)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(VisualHomingApi::class.java)
    }
    
    init {
        setBaseUrl(baseUrl)
    }
    
    // Connection check
    suspend fun checkConnection(): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val response = api?.healthCheck()
            Result.success(response?.status == "healthy")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Telemetry stream (polls every 200ms)
    fun telemetryFlow(): Flow<TelemetryData> = flow {
        while (true) {
            try {
                val status = api?.getSmartRtlStatus()
                val sensors = api?.getSensorsStatus()
                
                emit(TelemetryData(
                    altitude = status?.currentAltitude ?: 0f,
                    speed = 0f, // TODO: get from separate endpoint
                    heading = 0f,
                    battery = 100,
                    satellites = 0,
                    homeDistance = status?.homeDistance ?: 0f,
                    roll = 0f,
                    pitch = 0f,
                    yaw = 0f,
                    mavlinkConnected = sensors?.mavlink?.connected ?: false,
                    opticalFlowConnected = sensors?.opticalFlow?.connected ?: false,
                    lidarConnected = sensors?.lidar?.connected ?: false,
                    cameraConnected = sensors?.camera?.connected ?: false,
                    rtlActive = status?.active ?: false,
                    rtlPhase = status?.phase ?: "idle",
                    rtlProgress = status?.returnProgress ?: 0f
                ))
            } catch (e: Exception) {
                // Emit error state
                emit(TelemetryData(
                    altitude = 0f,
                    speed = 0f,
                    heading = 0f,
                    battery = 0,
                    satellites = 0,
                    homeDistance = 0f,
                    roll = 0f,
                    pitch = 0f,
                    yaw = 0f,
                    mavlinkConnected = false,
                    opticalFlowConnected = false,
                    lidarConnected = false,
                    cameraConnected = false,
                    rtlActive = false,
                    rtlPhase = "error",
                    rtlProgress = 0f
                ))
            }
            delay(200) // 5 Hz update rate
        }
    }.flowOn(Dispatchers.IO)
    
    // Commands
    suspend fun startRecording(): Result<ApiResponse> = withContext(Dispatchers.IO) {
        try {
            // TODO: Add recording endpoint to firmware
            Result.success(ApiResponse(true, "Recording started"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun stopRecording(): Result<ApiResponse> = withContext(Dispatchers.IO) {
        try {
            Result.success(ApiResponse(true, "Recording stopped"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun startReturn(): Result<ApiResponse> = withContext(Dispatchers.IO) {
        try {
            val response = api?.startReturn()
            Result.success(response ?: ApiResponse(false, "No response"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun stopReturn(): Result<ApiResponse> = withContext(Dispatchers.IO) {
        try {
            val response = api?.stopReturn()
            Result.success(response ?: ApiResponse(false, "No response"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Routes
    suspend fun getRoutes(): Result<List<RouteResponse>> = withContext(Dispatchers.IO) {
        try {
            val routes = api?.getRoutes() ?: emptyList()
            Result.success(routes)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun generateDemoRoute(): Result<RouteResponse> = withContext(Dispatchers.IO) {
        try {
            val route = api?.generateDemoRoute()
            if (route != null) {
                Result.success(route)
            } else {
                Result.failure(Exception("No route returned"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Settings
    suspend fun getSettings(): Result<SettingsResponse> = withContext(Dispatchers.IO) {
        try {
            val settings = api?.getSettings()
            if (settings != null) {
                Result.success(settings)
            } else {
                Result.failure(Exception("No settings returned"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun saveSettings(settings: SettingsRequest): Result<ApiResponse> = withContext(Dispatchers.IO) {
        try {
            val response = api?.saveSettings(settings)
            Result.success(response ?: ApiResponse(false, "No response"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Stream URL
    fun getStreamUrl(): String = "$baseUrl/video_feed"
}

// Data class for combined telemetry
data class TelemetryData(
    val altitude: Float,
    val speed: Float,
    val heading: Float,
    val battery: Int,
    val satellites: Int,
    val homeDistance: Float,
    val roll: Float,
    val pitch: Float,
    val yaw: Float,
    val mavlinkConnected: Boolean,
    val opticalFlowConnected: Boolean,
    val lidarConnected: Boolean,
    val cameraConnected: Boolean,
    val rtlActive: Boolean,
    val rtlPhase: String,
    val rtlProgress: Float
)
