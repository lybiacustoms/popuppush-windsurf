package com.popuppush.player.layer

import android.content.Context
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import coil.ImageLoader
import coil.compose.rememberAsyncImagePainter
import coil.decode.GifDecoder
import coil.decode.ImageDecoderDecoder
import coil.request.ImageRequest
import kotlinx.coroutines.delay

/**
 * Layer3PopupAds - Manages pop-up advertisements
 * Supports GIF/PNG with animations and positioning
 */
class Layer3PopupAds(private val context: Context) {
    
    private var currentAdId: String? = null
    private var currentPosition: AdPosition = AdPosition.BOTTOM_RIGHT
    private var currentAnimation: AdAnimation = AdAnimation.FADE
    private var displayDuration: Int = 10 // seconds
    
    // State for Compose
    private var isVisible by mutableStateOf(false)
    private var currentUrl by mutableStateOf<String?>(null)
    
    /**
     * Show a popup ad
     */
    fun showAd(
        contentId: String,
        animation: String = "fade",
        position: String = "bottom-right"
    ) {
        currentAdId = contentId
        currentAnimation = AdAnimation.valueOf(animation.uppercase())
        currentPosition = AdPosition.valueOf(position.uppercase().replace("-", "_"))
        
        // Build URL
        currentUrl = "${BuildConfig.API_URL}/uploads/$contentId"
        isVisible = true
        
        // Auto-hide after duration
        // In production, this would be managed by the scheduler
    }
    
    /**
     * Hide current popup ad
     */
    fun hideAd() {
        isVisible = false
        currentAdId = null
        currentUrl = null
    }
    
    /**
     * Check if ad is currently showing
     */
    fun isShowing(): Boolean = isVisible
    
    /**
     * Get current ad ID
     */
    fun getCurrentAdId(): String? = currentAdId
    
    /**
     * Release resources
     */
    fun release() {
        hideAd()
    }
    
    /**
     * Composable for the popup ad overlay
     */
    @Composable
    fun PopupAdOverlay(modifier: Modifier = Modifier) {
        val context = LocalContext.current
        
        // Custom ImageLoader with GIF support
        val imageLoader = remember {
            ImageLoader.Builder(context)
                .components {
                    if (android.os.Build.VERSION.SDK_INT >= 28) {
                        add(ImageDecoderDecoder.Factory())
                    } else {
                        add(GifDecoder.Factory())
                    }
                }
                .build()
        }
        
        Box(modifier = modifier) {
            AnimatedVisibility(
                visible = isVisible,
                enter = getEnterAnimation(currentAnimation),
                exit = getExitAnimation(currentAnimation),
                modifier = Modifier.align(getAlignment(currentPosition))
            ) {
                currentUrl?.let { url ->
                    Box(
                        modifier = Modifier
                            .sizeIn(maxWidth = 400.dp, maxHeight = 300.dp)
                            .padding(16.dp)
                    ) {
                        Image(
                            painter = rememberAsyncImagePainter(
                                ImageRequest.Builder(context)
                                    .data(url)
                                    .crossfade(true)
                                    .build(),
                                imageLoader = imageLoader
                            ),
                            contentDescription = "Advertisement",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                }
            }
        }
    }
    
    /**
     * Get enter animation based on type
     */
    private fun getEnterAnimation(animation: AdAnimation): EnterTransition {
        return when (animation) {
            AdAnimation.FADE -> fadeIn(animationSpec = tween(500))
            AdAnimation.SLIDE -> slideInHorizontally(
                initialOffsetX = { it },
                animationSpec = tween(500)
            )
            AdAnimation.SLIDE_UP -> slideInVertically(
                initialOffsetY = { it },
                animationSpec = tween(500)
            )
            AdAnimation.BOUNCE -> scaleIn(
                initialScale = 0f,
                animationSpec = spring(dampingRatio = Spring.DampingRatioHighBouncy)
            )
            AdAnimation.ZOOM -> scaleIn(
                initialScale = 0.5f,
                animationSpec = tween(500)
            )
        }
    }
    
    /**
     * Get exit animation based on type
     */
    private fun getExitAnimation(animation: AdAnimation): ExitTransition {
        return when (animation) {
            AdAnimation.FADE -> fadeOut(animationSpec = tween(500))
            AdAnimation.SLIDE -> slideOutHorizontally(
                targetOffsetX = { it },
                animationSpec = tween(500)
            )
            AdAnimation.SLIDE_UP -> slideOutVertically(
                targetOffsetY = { it },
                animationSpec = tween(500)
            )
            AdAnimation.BOUNCE -> scaleOut(
                targetScale = 0f,
                animationSpec = spring(dampingRatio = Spring.DampingRatioHighBouncy)
            )
            AdAnimation.ZOOM -> scaleOut(
                targetScale = 0.5f,
                animationSpec = tween(500)
            )
        }
    }
    
    /**
     * Get alignment based on position
     */
    private fun getAlignment(position: AdPosition): Alignment {
        return when (position) {
            AdPosition.TOP_LEFT -> Alignment.TopStart
            AdPosition.TOP_RIGHT -> Alignment.TopEnd
            AdPosition.BOTTOM_LEFT -> Alignment.BottomStart
            AdPosition.BOTTOM_RIGHT -> Alignment.BottomEnd
            AdPosition.CENTER -> Alignment.Center
            AdPosition.TOP_CENTER -> Alignment.TopCenter
            AdPosition.BOTTOM_CENTER -> Alignment.BottomCenter
        }
    }
}

/**
 * Ad Animation Types
 */
enum class AdAnimation {
    FADE,
    SLIDE,
    SLIDE_UP,
    BOUNCE,
    ZOOM
}

/**
 * Ad Position Types
 */
enum class AdPosition {
    TOP_LEFT,
    TOP_RIGHT,
    BOTTOM_LEFT,
    BOTTOM_RIGHT,
    CENTER,
    TOP_CENTER,
    BOTTOM_CENTER
}
