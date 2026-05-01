package com.popuppush.player.service

import android.content.Context
import android.util.Log
import com.popuppush.player.BuildConfig
import com.popuppush.player.data.LayerUpdate
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import org.json.JSONObject

/**
 * SocketService - Manages WebSocket connection to cloud server
 * Handles real-time commands and status updates
 */
class SocketService(private val context: Context) {
    
    private var socket: Socket? = null
    private val TAG = "SocketService"
    
    private val _layerUpdates = MutableSharedFlow<LayerUpdate>(extraBufferCapacity = 10)
    val layerUpdates: SharedFlow<LayerUpdate> = _layerUpdates
    
    private var deviceId: String? = null
    private var cafeId: String? = null
    private var isConnected = false
    
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    
    /**
     * Connect to WebSocket server
     */
    suspend fun connect() {
        try {
            // Load device credentials from storage
            val prefs = context.getSharedPreferences("device_prefs", Context.MODE_PRIVATE)
            deviceId = prefs.getString("device_id", null)
            cafeId = prefs.getString("cafe_id", null)
            
            if (deviceId == null || cafeId == null) {
                Log.e(TAG, "Device not registered")
                return
            }
            
            // Configure socket options
            val options = IO.Options().apply {
                reconnection = true
                reconnectionAttempts = 10
                reconnectionDelay = 1000
                reconnectionDelayMax = 5000
                timeout = 20000
            }
            
            // Connect
            socket = IO.socket(BuildConfig.SOCKET_URL, options)
            
            setupEventListeners()
            
            socket?.connect()
            
            Log.i(TAG, "Connecting to ${BuildConfig.SOCKET_URL}")
            
        } catch (e: Exception) {
            Log.e(TAG, "Connection failed", e)
        }
    }
    
    /**
     * Set up WebSocket event listeners
     */
    private fun setupEventListeners() {
        socket?.apply {
            // Connection events
            on(Socket.EVENT_CONNECT, Emitter.Listener {
                Log.i(TAG, "Connected to server")
                isConnected = true
                registerDevice()
            })
            
            on(Socket.EVENT_DISCONNECT, Emitter.Listener {
                Log.i(TAG, "Disconnected from server")
                isConnected = false
            })
            
            on(Socket.EVENT_CONNECT_ERROR, Emitter.Listener { args ->
                Log.e(TAG, "Connection error: ${args?.joinToString()}")
                isConnected = false
            })
            
            // Layer updates from server
            on("layer:update") { args ->
                try {
                    val data = args[0] as JSONObject
                    val update = LayerUpdate(
                        layerNumber = data.getInt("layerNumber"),
                        active = data.optBoolean("active", false),
                        contentId = data.optString("contentId", null),
                        playlistId = data.optString("playlistId", null),
                        inputSource = data.optString("inputSource", null),
                        text = data.optString("text", null),
                        animation = data.optString("animation", "fade"),
                        position = data.optString("position", "bottom-right"),
                        scrollSpeed = data.optInt("scrollSpeed", 50),
                        volume = data.optDouble("volume", 1.0).toFloat()
                    )
                    
                    serviceScope.launch {
                        _layerUpdates.emit(update)
                    }
                    
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing layer update", e)
                }
            }
            
            // Full state sync
            on("layer:init") { args ->
                try {
                    val data = args[0] as JSONObject
                    // Parse and apply full layer state
                    Log.i(TAG, "Received initial layer state")
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing init state", e)
                }
            }
            
            // Playlist commands
            on("playlist:start") { args ->
                try {
                    val data = args[0] as JSONObject
                    val playlistId = data.getString("playlistId")
                    Log.i(TAG, "Starting playlist: $playlistId")
                } catch (e: Exception) {
                    Log.e(TAG, "Error starting playlist", e)
                }
            }
            
            // Commands
            on("command:play") {
                Log.i(TAG, "Play command received")
                // Handle play command
            }
            
            on("command:pause") {
                Log.i(TAG, "Pause command received")
                // Handle pause command
            }
            
            on("command:next") {
                Log.i(TAG, "Next command received")
                // Handle next command
            }
            
            on("command:volume") { args ->
                try {
                    val data = args[0] as JSONObject
                    val volume = data.getDouble("volume").toFloat()
                    Log.i(TAG, "Volume command: $volume")
                } catch (e: Exception) {
                    Log.e(TAG, "Error setting volume", e)
                }
            }
            
            // Sports events
            on("match:start") { args ->
                try {
                    val data = args[0] as JSONObject
                    val matchName = data.getString("matchName")
                    Log.i(TAG, "Match starting: $matchName")
                    // Switch to HDMI input
                } catch (e: Exception) {
                    Log.e(TAG, "Error handling match start", e)
                }
            }
            
            on("match:end") {
                Log.i(TAG, "Match ended - switching back")
                // Switch back to regular playlist
            }
        }
    }
    
    /**
     * Register device with server
     */
    private fun registerDevice() {
        socket?.emit("device:register", JSONObject().apply {
            put("deviceId", deviceId)
            put("cafeId", cafeId)
            put("deviceInfo", JSONObject().apply {
                put("model", android.os.Build.MODEL)
                put("manufacturer", android.os.Build.MANUFACTURER)
                put("androidVersion", android.os.Build.VERSION.RELEASE)
                put("appVersion", BuildConfig.VERSION_NAME)
            })
        })
        
        Log.i(TAG, "Registered device: $deviceId")
    }
    
    /**
     * Send status update to server
     */
    fun sendStatus(status: DeviceStatus) {
        if (!isConnected) return
        
        socket?.emit("device:status", JSONObject().apply {
            put("deviceId", deviceId)
            put("status", JSONObject().apply {
                put("online", true)
                put("currentLayer1", status.currentLayer1)
                put("currentLayer2", status.currentLayer2)
                put("currentLayer3", status.currentLayer3)
                put("currentLayer4", status.currentLayer4)
                put("isPlaying", status.isPlaying)
                put("volume", status.volume)
                put("currentContent", status.currentContent)
            })
        })
    }
    
    /**
     * Send layer state report
     */
    fun reportLayerState(layerNumber: Int, state: Any) {
        if (!isConnected) return
        
        socket?.emit("layer:report", JSONObject().apply {
            put("deviceId", deviceId)
            put("layerNumber", layerNumber)
            put("state", state)
        })
    }
    
    /**
     * Send command acknowledgment
     */
    fun acknowledgeCommand(commandId: String, status: String) {
        socket?.emit("command:ack", JSONObject().apply {
            put("commandId", commandId)
            put("deviceId", deviceId)
            put("status", status)
        })
    }
    
    /**
     * Disconnect from server
     */
    fun disconnect() {
        serviceScope.cancel()
        socket?.disconnect()
        socket = null
        isConnected = false
        Log.i(TAG, "Disconnected")
    }
    
    /**
     * Check connection status
     */
    fun isConnected(): Boolean = isConnected
    
    /**
     * Get device ID
     */
    fun getDeviceId(): String? = deviceId
}

/**
 * Device status data class
 */
data class DeviceStatus(
    val currentLayer1: String?,
    val currentLayer2: String?,
    val currentLayer3: String?,
    val currentLayer4: String?,
    val isPlaying: Boolean,
    val volume: Float,
    val currentContent: String?
)
