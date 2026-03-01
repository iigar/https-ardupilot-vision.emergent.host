package com.visualhoming.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.visualhoming.ui.screens.*

sealed class Screen(val route: String, val title: String, val icon: @Composable () -> Unit) {
    data object Dashboard : Screen("dashboard", "Карта", { Icon(Icons.Default.Map, contentDescription = null) })
    data object Telemetry : Screen("telemetry", "Телеметрія", { Icon(Icons.Default.Speed, contentDescription = null) })
    data object Camera : Screen("camera", "Камера", { Icon(Icons.Default.Videocam, contentDescription = null) })
    data object Hotspot : Screen("hotspot", "Hotspot", { Icon(Icons.Default.Wifi, contentDescription = null) })
    data object Settings : Screen("settings", "Налаштування", { Icon(Icons.Default.Settings, contentDescription = null) })
}

val bottomNavItems = listOf(
    Screen.Dashboard,
    Screen.Telemetry,
    Screen.Camera,
    Screen.Hotspot,
    Screen.Settings
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VisualHomingApp() {
    val navController = rememberNavController()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Visual Homing") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.primary
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface
            ) {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination
                
                bottomNavItems.forEach { screen ->
                    NavigationBarItem(
                        icon = screen.icon,
                        label = { Text(screen.title) },
                        selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            indicatorColor = MaterialTheme.colorScheme.surfaceVariant
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Dashboard.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Dashboard.route) { DashboardScreen() }
            composable(Screen.Telemetry.route) { TelemetryScreen() }
            composable(Screen.Camera.route) { CameraScreen() }
            composable(Screen.Hotspot.route) { HotspotScreen() }
            composable(Screen.Settings.route) { SettingsScreen() }
        }
    }
}
