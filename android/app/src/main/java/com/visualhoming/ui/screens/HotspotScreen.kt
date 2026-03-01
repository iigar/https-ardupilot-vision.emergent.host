package com.visualhoming.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.visualhoming.ui.theme.VHCyan
import com.visualhoming.ui.theme.VHGreen
import com.visualhoming.ui.theme.VHYellow

data class ConnectedDevice(
    val name: String,
    val ip: String,
    val type: DeviceType
)

enum class DeviceType {
    RASPBERRY_PI,
    PHONE,
    PC,
    UNKNOWN
}

@Composable
fun HotspotScreen() {
    var hotspotEnabled by remember { mutableStateOf(false) }
    var ssid by remember { mutableStateOf("VisualHoming") }
    var password by remember { mutableStateOf("drone12345") }
    
    val connectedDevices = remember {
        mutableStateListOf(
            ConnectedDevice("visual-homing", "192.168.43.101", DeviceType.RASPBERRY_PI),
            ConnectedDevice("Laptop", "192.168.43.102", DeviceType.PC)
        )
    }
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Hotspot Toggle Card
        item {
            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant,
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.WifiTethering,
                                contentDescription = null,
                                tint = if (hotspotEnabled) VHGreen else MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(32.dp)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "Mobile Hotspot",
                                    style = MaterialTheme.typography.titleMedium
                                )
                                Text(
                                    text = if (hotspotEnabled) "Увімкнено" else "Вимкнено",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (hotspotEnabled) VHGreen else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        
                        Switch(
                            checked = hotspotEnabled,
                            onCheckedChange = { hotspotEnabled = it },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = VHGreen,
                                checkedTrackColor = VHGreen.copy(alpha = 0.5f)
                            )
                        )
                    }
                    
                    if (hotspotEnabled) {
                        Spacer(modifier = Modifier.height(16.dp))
                        Divider(color = MaterialTheme.colorScheme.surface)
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        // Network info
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(
                                    text = "SSID",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = ssid,
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = VHCyan
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = "Пароль",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = password,
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = VHCyan
                                )
                            }
                        }
                    }
                }
            }
        }
        
        // QR Code Card
        if (hotspotEnabled) {
            item {
                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "QR код для підключення",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        // QR placeholder
                        Surface(
                            color = Color.White,
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.size(150.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.QrCode2,
                                    contentDescription = null,
                                    tint = Color.Black,
                                    modifier = Modifier.size(120.dp)
                                )
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "Скануйте з Pi або ПК",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
        
        // Connected Devices
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Devices,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Підключені пристрої",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                
                Surface(
                    color = MaterialTheme.colorScheme.primary,
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "${connectedDevices.size}",
                        style = MaterialTheme.typography.labelMedium,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        color = Color.Black
                    )
                }
            }
        }
        
        if (hotspotEnabled && connectedDevices.isNotEmpty()) {
            items(connectedDevices) { device ->
                DeviceCard(device = device)
            }
        } else if (hotspotEnabled) {
            item {
                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.DevicesOther,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "Очікування підключень...",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
        
        // Settings
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Налаштування точки доступу",
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.primary
            )
        }
        
        item {
            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant,
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    OutlinedTextField(
                        value = ssid,
                        onValueChange = { ssid = it },
                        label = { Text("Назва мережі (SSID)") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !hotspotEnabled
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Пароль") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !hotspotEnabled
                    )
                }
            }
        }
    }
}

@Composable
private fun DeviceCard(device: ConnectedDevice) {
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
            // Device icon
            Surface(
                color = when (device.type) {
                    DeviceType.RASPBERRY_PI -> VHGreen
                    DeviceType.PC -> VHCyan
                    DeviceType.PHONE -> VHYellow
                    else -> MaterialTheme.colorScheme.surface
                },
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.size(40.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = when (device.type) {
                            DeviceType.RASPBERRY_PI -> Icons.Default.DeveloperBoard
                            DeviceType.PC -> Icons.Default.Computer
                            DeviceType.PHONE -> Icons.Default.PhoneAndroid
                            else -> Icons.Default.DeviceUnknown
                        },
                        contentDescription = null,
                        tint = Color.Black,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = device.name,
                    style = MaterialTheme.typography.titleSmall
                )
                Text(
                    text = device.ip,
                    style = MaterialTheme.typography.bodySmall,
                    color = VHCyan
                )
            }
            
            if (device.type == DeviceType.RASPBERRY_PI) {
                TextButton(onClick = { /* Connect */ }) {
                    Text("Підключити")
                }
            }
        }
    }
}
