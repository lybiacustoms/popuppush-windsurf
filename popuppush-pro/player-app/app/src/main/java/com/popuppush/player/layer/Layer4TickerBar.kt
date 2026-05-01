package com.popuppush.player.layer

import android.content.Context
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

/**
 * Layer4TickerBar - Scrolling text ticker for news/announcements
 * Optimized for Arabic (RTL) and English (LTR) support
 */
class Layer4TickerBar(private val context: Context) {
    
    private var currentText by mutableStateOf("")
    private var scrollSpeed by mutableStateOf(50) // pixels per second
    private var isRtl by mutableStateOf(true) // Default RTL for Arabic
    private var fontSize by mutableStateOf(24)
    private var backgroundColor by mutableStateOf(Color(0xCC000000)) // Semi-transparent black
    private var textColor by mutableStateOf(Color.White)
    private var isVisible by mutableStateOf(true)
    
    /**
     * Update ticker text
     */
    fun updateText(
        text: String?,
        speed: Int? = null,
        rtl: Boolean? = null,
        bgColor: String? = null,
        txtColor: String? = null
    ) {
        currentText = text ?: ""
        speed?.let { scrollSpeed = it }
        rtl?.let { isRtl = it }
        bgColor?.let { backgroundColor = parseColor(it) }
        txtColor?.let { textColor = parseColor(it) }
    }
    
    /**
     * Show/hide ticker
     */
    fun show() {
        isVisible = true
    }
    
    fun hide() {
        isVisible = false
    }
    
    /**
     * Parse hex color string
     */
    private fun parseColor(colorString: String): Color {
        return try {
            val hex = colorString.replace("#", "")
            val alpha = if (hex.length == 8) hex.substring(0, 2).toInt(16) else 255
            val rgb = if (hex.length == 8) hex.substring(2) else hex
            
            Color(
                alpha = alpha,
                red = rgb.substring(0, 2).toInt(16),
                green = rgb.substring(2, 4).toInt(16),
                blue = rgb.substring(4, 6).toInt(16)
            )
        } catch (e: Exception) {
            Color.White
        }
    }
    
    /**
     * Release resources
     */
    fun release() {
        currentText = ""
    }
    
    /**
     * Composable for the ticker bar
     */
    @Composable
    fun TickerBar(modifier: Modifier = Modifier) {
        if (!isVisible || currentText.isEmpty()) return
        
        Box(
            modifier = modifier
                .fillMaxWidth()
                .height(50.dp)
                .background(backgroundColor)
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            InfiniteScrollingText(
                text = currentText,
                speed = scrollSpeed,
                isRtl = isRtl,
                textColor = textColor,
                fontSize = fontSize.sp,
                modifier = Modifier.align(Alignment.Center)
            )
        }
    }
}

/**
 * Infinite scrolling text composable
 */
@Composable
fun InfiniteScrollingText(
    text: String,
    speed: Int,
    isRtl: Boolean,
    textColor: Color,
    fontSize: androidx.compose.ui.unit.TextUnit,
    modifier: Modifier = Modifier
) {
    // Create infinite animation
    val infiniteTransition = rememberInfiniteTransition(label = "ticker")
    
    // Animate offset based on direction
    val offset by infiniteTransition.animateFloat(
        initialValue = if (isRtl) 1000f else -1000f,
        targetValue = if (isRtl) -1000f else 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = (30000 * 100) / speed, // Adjust speed
                easing = LinearEasing
            ),
            repeatMode = RepeatMode.Restart
        ),
        label = "scroll"
    )
    
    Box(
        modifier = modifier.fillMaxWidth(),
        contentAlignment = if (isRtl) Alignment.CenterEnd else Alignment.CenterStart
    ) {
        BasicText(
            text = text,
            style = TextStyle(
                color = textColor,
                fontSize = fontSize
            ),
            overflow = TextOverflow.Visible,
            maxLines = 1,
            modifier = Modifier
                .offset(x = offset.dp)
        )
    }
}

/**
 * Data class for ticker configuration
 */
data class TickerConfig(
    val text: String,
    val speed: Int = 50,
    val isRtl: Boolean = true,
    val fontSize: Int = 24,
    val backgroundColor: String = "#CC000000",
    val textColor: String = "#FFFFFF"
)
