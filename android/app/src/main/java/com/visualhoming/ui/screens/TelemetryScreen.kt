package com.visualhoming.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.visualhoming.ui.theme.VHCyan
import com.visualhoming.ui.theme.VHGreen
import com.visualhoming.ui.theme.VHRed
import com.visualhoming.ui.theme.VHYellow

@Composable
fun TelemetryScreen() {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Flight Data
        item {
            SectionHeader(title = "Дані польоту", icon = Icons.Default.Flight)
        }
        
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                DataCard(
                    modifier = Modifier.weight(1f),
                    title = "Висота",
                    value = "45.2",
                    unit = "m",
                    icon = Icons.Default.Height,
                    color = VHCyan
                )
                DataCard(
                    modifier = Modifier.weight(1f),
                    title = "Швидкість",
                    value = "12.5",
                    unit = "m/s",
                    icon = Icons.Default.Speed,
                    color = VHGreen
                )
            }
        }
        
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                DataCard(
                    modifier = Modifier.weight(1f),
                    title = "До дому",
                    value = "156",
                    unit = "m",
                    icon = Icons.Default.Home,
                    color = VHYellow
                )
                DataCard(
                    modifier = Modifier.weight(1f),
                    title = "Курс",
                    value = "245",
                    unit = "°",
                    icon = Icons.Default.Explore,
                    color = VHCyan
                )
            }
        }
        
        // Sensors Status
        item {
            Spacer(modifier = Modifier.height(8.dp))
            SectionHeader(title = "Сенсори", icon = Icons.Default.Sensors)
        }
        
        item {
            SensorStatusCard(
                name = "MATEK 3901-L0X",
                description = "Optical Flow",
                connected = true,
                details = "Flow X: 0.12, Flow Y: -0.05"
            )
        }
        
        item {
            SensorStatusCard(
                name = "TF-Luna",
                description = "LiDAR",
                connected = true,
                details = "Distance: 4.52m, Signal: 892"
            )
        }
        
        item {
            SensorStatusCard(
                name = "Pi Camera",
                description = "Visual Odometry",
                connected = true,
                details = "FPS: 30, Features: 245"
            )
        }
        
        // Smart RTL Status
        item {
            Spacer(modifier = Modifier.height(8.dp))
            SectionHeader(title = "Smart RTL", icon = Icons.Default.Assistant)
        }
        
        item {
            SmartRtlCard(
                active = false,
                phase = "Idle",
                progress = 0f,
                navSource = "Visual"
            )
        }
        
        // MAVLink Status
        item {
            Spacer(modifier = Modifier.height(8.dp))
            SectionHeader(title = "MAVLink", icon = Icons.Default.Cable)
        }
        
        item {
            MavlinkCard(
                connected = false,
                systemId = 1,
                componentId = 191,
                messagesReceived = 0
            )
        }
    }
}

@Composable
private fun SectionHeader(
    title: String,
    icon: ImageVector
) {
    Row(
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.primary
        )
    }
}

@Composable
private fun DataCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    unit: String,
    icon: ImageVector,
    color: Color
) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.surfaceVariant,
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(32.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(
                    verticalAlignment = Alignment.Bottom
                ) {
                    Text(
                        text = value,
                        style = MaterialTheme.typography.headlineMedium,
                        color = color
                    )
                    Text(
                        text = " $unit",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
private fun SensorStatusCard(
    name: String,
    description: String,
    connected: Boolean,
    details: String
) {
    Surface(
        color = MaterialTheme.colorScheme.surfaceVariant,
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Status indicator
            Surface(
                color = if (connected) VHGreen else VHRed,
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.size(40.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = if (connected) Icons.Default.Check else Icons.Default.Close,
                        contentDescription = null,
                        tint = Color.Black,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = name,
                    style = MaterialTheme.typography.titleSmall
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (connected) {
                    Text(
                        text = details,
                        style = MaterialTheme.typography.labelSmall,
                        color = VHCyan
                    )
                }
            }
            
            Text(
                text = if (connected) "ONLINE" else "OFFLINE",
                style = MaterialTheme.typography.labelMedium,
                color = if (connected) VHGreen else VHRed
            )
        }
    }
}

@Composable
private fun SmartRtlCard(
    active: Boolean,
    phase: String,
    progress: Float,
    navSource: String
) {
    Surface(
        color = MaterialTheme.colorScheme.surfaceVariant,
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Статус: $phase",
                    style = MaterialTheme.typography.titleSmall
                )
                Surface(
                    color = if (active) VHGreen else MaterialTheme.colorScheme.surface,
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = if (active) "ACTIVE" else "IDLE",
                        style = MaterialTheme.typography.labelMedium,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        color = if (active) Color.Black else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            if (active) {
                Spacer(modifier = Modifier.height(12.dp))
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier.fillMaxWidth(),
                    color = VHCyan
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Джерело навігації: $navSource",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun MavlinkCard(
    connected: Boolean,
    systemId: Int,
    componentId: Int,
    messagesReceived: Long
) {
    Surface(
        color = MaterialTheme.colorScheme.surfaceVariant,
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = if (connected) Icons.Default.Link else Icons.Default.LinkOff,
                contentDescription = null,
                tint = if (connected) VHGreen else VHRed,
                modifier = Modifier.size(32.dp)
            )
            
            Spacer(modifier = Modifier.width(12.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = if (connected) "Підключено" else "Відключено",
                    style = MaterialTheme.typography.titleSmall,
                    color = if (connected) VHGreen else VHRed
                )
                if (connected) {
                    Text(
                        text = "System: $systemId, Component: $componentId",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "Messages: $messagesReceived",
                        style = MaterialTheme.typography.labelSmall,
                        color = VHCyan
                    )
                }
            }
        }
    }
}
