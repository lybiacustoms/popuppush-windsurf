package com.popuppush.player.layer

import android.content.Context
import android.net.Uri
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.popuppush.player.data.PlaylistItem

/**
 * Layer1Media - Manages video and audio content playback
 * Uses ExoPlayer for robust media handling
 */
class Layer1Media(private val context: Context) {
    
    private var exoPlayer: ExoPlayer? = null
    private var playerView: PlayerView? = null
    private var currentPlaylist: List<PlaylistItem> = emptyList()
    private var currentIndex: Int = 0
    private var isPlaying: Boolean = false
    
    init {
        initializePlayer()
    }
    
    private fun initializePlayer() {
        exoPlayer = ExoPlayer.Builder(context).build().apply {
            // Configure for gapless playback
            setHandleAudioBecomingNoisy(true)
            
            // Listener for playlist progression
            addListener(object : Player.Listener {
                override fun onPlaybackStateChanged(playbackState: Int) {
                    when (playbackState) {
                        Player.STATE_ENDED -> playNextItem()
                        Player.STATE_READY -> isPlaying = true
                        Player.STATE_BUFFERING -> { /* Show loading if needed */ }
                        Player.STATE_IDLE -> isPlaying = false
                    }
                }
                
                override fun onIsPlayingChanged(isPlaying: Boolean) {
                    this@Layer1Media.isPlaying = isPlaying
                }
            })
        }
        
        playerView = PlayerView(context).apply {
            player = exoPlayer
            useController = false // Hide default controls
            resizeMode = PlayerView.RESIZE_MODE_FIT
        }
    }
    
    /**
     * Get the PlayerView for Compose integration
     */
    fun getPlayerView(): PlayerView {
        return playerView ?: throw IllegalStateException("Player not initialized")
    }
    
    /**
     * Load content - either single item or playlist
     */
    fun loadContent(contentId: String? = null, playlistId: String? = null) {
        when {
            playlistId != null -> loadPlaylist(playlistId)
            contentId != null -> loadSingleItem(contentId)
            else -> { /* Nothing to load */ }
        }
    }
    
    private fun loadSingleItem(contentId: String) {
        val url = "${BuildConfig.API_URL}/uploads/$contentId" // Simplified URL construction
        val mediaItem = MediaItem.fromUri(Uri.parse(url))
        
        exoPlayer?.apply {
            setMediaItem(mediaItem)
            prepare()
            play()
        }
    }
    
    private fun loadPlaylist(playlistId: String) {
        // In production, fetch playlist from API
        // For now, simulate with empty list
        currentPlaylist = emptyList()
        currentIndex = 0
        
        if (currentPlaylist.isNotEmpty()) {
            playItemAt(currentIndex)
        }
    }
    
    private fun playItemAt(index: Int) {
        if (index >= currentPlaylist.size) {
            // Loop back to start
            currentIndex = 0
        }
        
        val item = currentPlaylist.getOrNull(currentIndex) ?: return
        
        val url = "${BuildConfig.API_URL}/uploads/${item.contentId}"
        val mediaItem = MediaItem.fromUri(Uri.parse(url))
        
        exoPlayer?.apply {
            setMediaItem(mediaItem)
            prepare()
            play()
        }
    }
    
    private fun playNextItem() {
        currentIndex++
        if (currentIndex < currentPlaylist.size) {
            playItemAt(currentIndex)
        } else {
            // End of playlist - loop or stop based on settings
            currentIndex = 0
            playItemAt(currentIndex)
        }
    }
    
    /**
     * Play control
     */
    fun play() {
        exoPlayer?.play()
    }
    
    fun pause() {
        exoPlayer?.pause()
    }
    
    fun stop() {
        exoPlayer?.stop()
        currentIndex = 0
    }
    
    fun next() {
        playNextItem()
    }
    
    fun previous() {
        if (currentIndex > 0) {
            currentIndex--
            playItemAt(currentIndex)
        }
    }
    
    /**
     * Volume control (0.0 to 1.0)
     */
    fun setVolume(volume: Float) {
        exoPlayer?.volume = volume.coerceIn(0f, 1f)
    }
    
    fun getVolume(): Float {
        return exoPlayer?.volume ?: 1f
    }
    
    /**
     * Seek to position
     */
    fun seekTo(positionMs: Long) {
        exoPlayer?.seekTo(positionMs)
    }
    
    fun getCurrentPosition(): Long {
        return exoPlayer?.currentPosition ?: 0
    }
    
    fun getDuration(): Long {
        return exoPlayer?.duration ?: 0
    }
    
    /**
     * Lifecycle methods
     */
    fun onResume() {
        exoPlayer?.playWhenReady = true
    }
    
    fun onPause() {
        exoPlayer?.playWhenReady = false
    }
    
    fun release() {
        exoPlayer?.release()
        exoPlayer = null
        playerView = null
    }
    
    /**
     * Check if currently playing
     */
    fun isPlaying(): Boolean = isPlaying
    
    /**
     * Get current playing content ID
     */
    fun getCurrentContentId(): String? {
        return currentPlaylist.getOrNull(currentIndex)?.contentId
    }
}
