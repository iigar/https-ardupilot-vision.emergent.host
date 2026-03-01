package com.visualhoming.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// Visual Homing branded colors
val VHCyan = Color(0xFF00D4FF)
val VHCyanDark = Color(0xFF00A8CC)
val VHYellow = Color(0xFFFFD700)
val VHGreen = Color(0xFF00FF88)
val VHRed = Color(0xFFFF4444)
val VHBackground = Color(0xFF0A0F14)
val VHSurface = Color(0xFF141A22)
val VHSurfaceVariant = Color(0xFF1E2832)

private val DarkColorScheme = darkColorScheme(
    primary = VHCyan,
    onPrimary = Color.Black,
    secondary = VHYellow,
    onSecondary = Color.Black,
    tertiary = VHGreen,
    error = VHRed,
    background = VHBackground,
    onBackground = Color.White,
    surface = VHSurface,
    onSurface = Color.White,
    surfaceVariant = VHSurfaceVariant,
    onSurfaceVariant = Color(0xFFB0B8C0)
)

// High contrast theme for field use (bright sunlight)
private val FieldColorScheme = darkColorScheme(
    primary = Color(0xFF00FFFF),
    onPrimary = Color.Black,
    secondary = Color(0xFFFFFF00),
    onSecondary = Color.Black,
    tertiary = Color(0xFF00FF00),
    error = Color(0xFFFF0000),
    background = Color.Black,
    onBackground = Color.White,
    surface = Color(0xFF1A1A1A),
    onSurface = Color.White,
    surfaceVariant = Color(0xFF333333),
    onSurfaceVariant = Color.White
)

@Composable
fun VisualHomingTheme(
    darkTheme: Boolean = true, // Always dark for drone UI
    fieldMode: Boolean = false, // High contrast for outdoor use
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        fieldMode -> FieldColorScheme
        else -> DarkColorScheme
    }
    
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
