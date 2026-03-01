package com.visualhoming.hotspot

import android.content.Context
import android.net.wifi.WifiManager
import android.os.Build
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.withContext
import java.net.InetAddress
import javax.jmdns.JmDNS
import javax.jmdns.ServiceInfo

/**
 * Manages WiFi hotspot and device discovery
 */
class HotspotManager(private val context: Context) {
    
    companion object {
        private const val TAG = "HotspotManager"
        const val DEFAULT_SSID = "VisualHoming"
        const val DEFAULT_PASSWORD = "drone12345"
        const val PI_SERVICE_TYPE = "_http._tcp.local."
        const val PI_SERVICE_NAME = "visual-homing"
    }
    
    private val wifiManager = context.getSystemService(Context.WIFI_SERVICE) as WifiManager
    private var jmDNS: JmDNS? = null
    
    data class HotspotConfig(
        val ssid: String,
        val password: String,
        val enabled: Boolean
    )
    
    data class ConnectedDevice(
        val name: String,
        val ipAddress: String,
        val macAddress: String?,
        val isPi: Boolean
    )
    
    /**
     * Check if hotspot is currently enabled
     * Note: Requires WRITE_SETTINGS permission for API < 26
     */
    fun isHotspotEnabled(): Boolean {
        return try {
            val method = wifiManager.javaClass.getDeclaredMethod("isWifiApEnabled")
            method.isAccessible = true
            method.invoke(wifiManager) as Boolean
        } catch (e: Exception) {
            Log.e(TAG, "Failed to check hotspot status", e)
            false
        }
    }
    
    /**
     * Start WiFi hotspot
     * Note: On Android 8+, this requires special handling via TetheringManager
     */
    suspend fun startHotspot(
        ssid: String = DEFAULT_SSID,
        password: String = DEFAULT_PASSWORD
    ): Result<HotspotConfig> = withContext(Dispatchers.IO) {
        try {
            // On Android 10+, programmatic hotspot control is restricted
            // User needs to enable it manually or via Settings Intent
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Guide user to settings
                return@withContext Result.failure(
                    UnsupportedOperationException(
                        "Android 10+ requires manual hotspot activation. " +
                        "Please enable hotspot in Settings with SSID: $ssid, Password: $password"
                    )
                )
            }
            
            // For older versions, try reflection (may not work on all devices)
            val wifiConfig = Class.forName("android.net.wifi.WifiConfiguration").newInstance()
            wifiConfig.javaClass.getField("SSID").set(wifiConfig, ssid)
            wifiConfig.javaClass.getField("preSharedKey").set(wifiConfig, password)
            
            val method = wifiManager.javaClass.getMethod(
                "setWifiApEnabled",
                Class.forName("android.net.wifi.WifiConfiguration"),
                Boolean::class.java
            )
            method.invoke(wifiManager, wifiConfig, true)
            
            Result.success(HotspotConfig(ssid, password, true))
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start hotspot", e)
            Result.failure(e)
        }
    }
    
    /**
     * Stop WiFi hotspot
     */
    suspend fun stopHotspot(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val method = wifiManager.javaClass.getMethod(
                "setWifiApEnabled",
                Class.forName("android.net.wifi.WifiConfiguration"),
                Boolean::class.java
            )
            method.invoke(wifiManager, null, false)
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop hotspot", e)
            Result.failure(e)
        }
    }
    
    /**
     * Get list of connected devices
     * This reads from /proc/net/arp on the device
     */
    suspend fun getConnectedDevices(): List<ConnectedDevice> = withContext(Dispatchers.IO) {
        val devices = mutableListOf<ConnectedDevice>()
        
        try {
            val proc = Runtime.getRuntime().exec("cat /proc/net/arp")
            val reader = proc.inputStream.bufferedReader()
            
            // Skip header line
            reader.readLine()
            
            reader.forEachLine { line ->
                val parts = line.split("\\s+".toRegex())
                if (parts.size >= 4) {
                    val ip = parts[0]
                    val mac = parts[3]
                    
                    // Try to resolve hostname
                    val hostname = try {
                        InetAddress.getByName(ip).hostName
                    } catch (e: Exception) {
                        ip
                    }
                    
                    val isPi = hostname.contains("visual-homing", ignoreCase = true) ||
                               hostname.contains("raspberry", ignoreCase = true)
                    
                    devices.add(ConnectedDevice(
                        name = hostname,
                        ipAddress = ip,
                        macAddress = mac,
                        isPi = isPi
                    ))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get connected devices", e)
        }
        
        devices
    }
    
    /**
     * Discover Raspberry Pi using mDNS/Bonjour
     */
    suspend fun discoverPi(): ConnectedDevice? = withContext(Dispatchers.IO) {
        try {
            // Get local address
            val localAddress = InetAddress.getLocalHost()
            jmDNS = JmDNS.create(localAddress, "VisualHomingDiscovery")
            
            val services = jmDNS?.list(PI_SERVICE_TYPE, 5000)
            
            services?.forEach { service ->
                if (service.name.contains(PI_SERVICE_NAME, ignoreCase = true)) {
                    val addresses = service.inet4Addresses
                    if (addresses.isNotEmpty()) {
                        return@withContext ConnectedDevice(
                            name = service.name,
                            ipAddress = addresses[0].hostAddress ?: "",
                            macAddress = null,
                            isPi = true
                        )
                    }
                }
            }
            
            null
        } catch (e: Exception) {
            Log.e(TAG, "mDNS discovery failed", e)
            null
        } finally {
            jmDNS?.close()
            jmDNS = null
        }
    }
    
    /**
     * Flow of connected devices (polls every 5 seconds)
     */
    fun connectedDevicesFlow(): Flow<List<ConnectedDevice>> = flow {
        while (true) {
            emit(getConnectedDevices())
            delay(5000)
        }
    }
    
    /**
     * Generate QR code content for WiFi connection
     */
    fun generateWifiQrCode(ssid: String, password: String): String {
        // WiFi QR code format: WIFI:T:WPA;S:<SSID>;P:<PASSWORD>;;
        return "WIFI:T:WPA;S:$ssid;P:$password;;"
    }
}
