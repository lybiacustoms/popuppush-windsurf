package com.popuppush.player.data

/**
 * Data models for Pop-up Push Player App
 */

/**
 * Layer update from server
 */
data class LayerUpdate(
    val layerNumber: Int,
    val active: Boolean = false,
    val contentId: String? = null,
    val playlistId: String? = null,
    val inputSource: String? = null,
    val text: String? = null,
    val animation: String = "fade",
    val position: String = "bottom-right",
    val scrollSpeed: Int = 50,
    val volume: Float = 1.0f
)

/**
 * Playlist item
 */
data class PlaylistItem(
    val contentId: String,
    val order: Int,
    val duration: Int? = null, // null = play full
    val transition: String = "fade",
    val repeat: Int = 1
)

/**
 * Complete playlist
 */
data class Playlist(
    val id: String,
    val name: String,
    val items: List<PlaylistItem>,
    val shuffle: Boolean = false,
    val loop: Boolean = true
)

/**
 * Content item
 */
data class ContentItem(
    val id: String,
    val title: String,
    val type: ContentType,
    val url: String,
    val duration: Int? = null,
    val thumbnailUrl: String? = null
)

enum class ContentType {
    VIDEO,
    AUDIO,
    IMAGE,
    GIF,
    YOUTUBE,
    URL
}

/**
 * Device configuration
 */
data class DeviceConfig(
    val deviceId: String,
    val cafeId: String,
    val name: String,
    val resolution: String = "1080p",
    val orientation: String = "landscape",
    val brightness: Int = 80,
    val defaultVolume: Int = 70
)

/**
 * Sports match
 */
data class SportsMatch(
    val id: String,
    val league: String,
    val homeTeam: String,
    val awayTeam: String,
    val matchTime: Long,
    val status: MatchStatus
)

enum class MatchStatus {
    UPCOMING,
    LIVE,
    HALFTIME,
    FINISHED
}

/**
 * Ad configuration
 */
data class AdConfig(
    val id: String,
    val type: AdType,
    val contentId: String,
    val duration: Int,
    val animation: String,
    val position: String,
    val priority: Int
)

enum class AdType {
    FULL_VIDEO,
    POPUP_IMAGE,
    POPUP_GIF,
    TICKER_TEXT
}

/**
 * System info for diagnostics
 */
data class SystemInfo(
    val cpuUsage: Float,
    val memoryUsage: Float,
    val storageUsage: Float,
    val temperature: Float? = null,
    val networkConnected: Boolean,
    val signalStrength: Int? = null
)
