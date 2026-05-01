package com.popuppush.player

import android.content.pm.ActivityInfo
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.lifecycleScope
import com.popuppush.player.layer.Layer1Media
import com.popuppush.player.layer.Layer2HdmiInput
import com.popuppush.player.layer.Layer3PopupAds
import com.popuppush.player.layer.Layer4TickerBar
import com.popuppush.player.service.SocketService
import com.popuppush.player.ui.theme.PopupPushTheme
import kotlinx.coroutines.launch

/**
 * PlayerActivity - Main entry point for Pop-up Push Player App
 * Manages the 4-layer display system on RK3588 hardware
 */
class PlayerActivity : ComponentActivity() {
    
    private lateinit var socketService: SocketService
    private lateinit var layer1Media: Layer1Media
    private lateinit var layer2HdmiInput: Layer2HdmiInput
    private lateinit var layer3PopupAds: Layer3PopupAds
    private lateinit var layer4TickerBar: Layer4TickerBar
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Full screen immersive mode
        setupFullscreen()
        
        // Lock to landscape
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        
        // Initialize layers
        initializeLayers()
        
        // Initialize socket connection
        socketService = SocketService(this)
        
        setContent {
            PopupPushTheme {
                FourLayerSystem()
            }
        }
        
        // Connect to server
        lifecycleScope.launch {
            socketService.connect()
        }
    }
    
    private fun setupFullscreen() {
        window.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )
        
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        )
    }
    
    private fun initializeLayers() {
        layer1Media = Layer1Media(this)
        layer2HdmiInput = Layer2HdmiInput(this)
        layer3PopupAds = Layer3PopupAds(this)
        layer4TickerBar = Layer4TickerBar(this)
    }
    
    override fun onResume() {
        super.onResume()
        // Resume media playback
        layer1Media.onResume()
    }
    
    override fun onPause() {
        super.onPause()
        // Pause media playback
        layer1Media.onPause()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        // Cleanup
        socketService.disconnect()
        layer1Media.release()
        layer2HdmiInput.release()
        layer3PopupAds.release()
        layer4TickerBar.release()
    }
    
    /**
     * Composable function for the 4-layer display system
     * Each layer is stacked using Z-index equivalent in Compose
     */
    @Composable
    fun FourLayerSystem() {
        val context = LocalContext.current
        
        // State for layer visibility
        var layer1Active by remember { mutableStateOf(true) }
        var layer2Active by remember { mutableStateOf(false) }
        var layer3Active by remember { mutableStateOf(false) }
        var layer4Active by remember { mutableStateOf(true) }
        
        // Listen for socket events
        LaunchedEffect(Unit) {
            socketService.layerUpdates.collect { update ->
                when (update.layerNumber) {
                    1 -> {
                        layer1Active = update.active
                        if (update.contentId != null) {
                            layer1Media.loadContent(update.contentId, update.playlistId)
                        }
                    }
                    2 -> {
                        layer2Active = update.active
                        if (update.inputSource != null) {
                            layer2HdmiInput.switchToInput(update.inputSource)
                        }
                    }
                    3 -> {
                        layer3Active = update.active
                        if (update.contentId != null) {
                            layer3PopupAds.showAd(update.contentId, update.animation, update.position)
                        }
                    }
                    4 -> {
                        layer4Active = update.active
                        layer4TickerBar.updateText(update.text, update.scrollSpeed)
                    }
                }
            }
        }
        
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black)
        ) {
            // Layer 1: Media (Bottom layer - z-index 100)
            if (layer1Active) {
                AndroidView(
                    factory = { layer1Media.getPlayerView() },
                    modifier = Modifier.fillMaxSize()
                )
            }
            
            // Layer 2: HDMI-IN (z-index 200)
            if (layer2Active) {
                AndroidView(
                    factory = { layer2HdmiInput.getSurfaceView() },
                    modifier = Modifier.fillMaxSize()
                )
            }
            
            // Layer 3: Pop-up Ads (z-index 300)
            if (layer3Active) {
                layer3PopupAds.PopupAdOverlay(
                    modifier = Modifier.fillMaxSize()
                )
            }
            
            // Layer 4: Ticker Bar (z-index 400 - Top layer)
            if (layer4Active) {
                layer4TickerBar.TickerBar(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(androidx.compose.ui.Alignment.BottomCenter)
                )
            }
        }
    }
}
