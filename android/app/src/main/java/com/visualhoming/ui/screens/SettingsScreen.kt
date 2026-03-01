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
import androidx.compose.ui.unit.dp
import com.visualhoming.ui.theme.VHCyan

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen() {
    var piHost by remember { mutableStateOf("visual-homing.local") }
    var piPort by remember { mutableStateOf("5000") }
    var autoConnect by remember { mutableStateOf(true) }
    var fieldMode by remember { mutableStateOf(false) }
    var hapticFeedback by remember { mutableStateOf(true) }
    var keepScreenOn by remember { mutableStateOf(true) }
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Connection Settings
        item {
            SettingsSection(title = "Підключення", icon = Icons.Default.Link)
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
                        value = piHost,
                        onValueChange = { piHost = it },
                        label = { Text("Адреса Pi") },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("visual-homing.local або IP") }
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    OutlinedTextField(
                        value = piPort,
                        onValueChange = { piPort = it },
                        label = { Text("Порт") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    SettingsSwitch(
                        title = "Автопідключення",
                        subtitle = "Автоматично підключатись при запуску",
                        checked = autoConnect,
                        onCheckedChange = { autoConnect = it }
                    )
                }
            }
        }
        
        item {
            Button(
                onClick = { /* Test connection */ },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.NetworkCheck, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Перевірити підключення")
            }
        }
        
        // Display Settings
        item {
            Spacer(modifier = Modifier.height(8.dp))
            SettingsSection(title = "Інтерфейс", icon = Icons.Default.Palette)
        }
        
        item {
            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant,
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    SettingsSwitch(
                        title = "Польовий режим",
                        subtitle = "Високий контраст для яскравого сонця",
                        checked = fieldMode,
                        onCheckedChange = { fieldMode = it }
                    )
                    
                    Divider(
                        modifier = Modifier.padding(vertical = 12.dp),
                        color = MaterialTheme.colorScheme.surface
                    )
                    
                    SettingsSwitch(
                        title = "Тактильний відгук",
                        subtitle = "Вібрація при натисканні кнопок",
                        checked = hapticFeedback,
                        onCheckedChange = { hapticFeedback = it }
                    )
                    
                    Divider(
                        modifier = Modifier.padding(vertical = 12.dp),
                        color = MaterialTheme.colorScheme.surface
                    )
                    
                    SettingsSwitch(
                        title = "Екран завжди увімкнений",
                        subtitle = "Не вимикати екран під час польоту",
                        checked = keepScreenOn,
                        onCheckedChange = { keepScreenOn = it }
                    )
                }
            }
        }
        
        // Camera Settings
        item {
            Spacer(modifier = Modifier.height(8.dp))
            SettingsSection(title = "Камера", icon = Icons.Default.Camera)
        }
        
        item {
            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant,
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    SettingsRow(
                        title = "Тип камери",
                        value = "Pi Camera"
                    )
                    
                    Divider(
                        modifier = Modifier.padding(vertical = 12.dp),
                        color = MaterialTheme.colorScheme.surface
                    )
                    
                    SettingsRow(
                        title = "Роздільність",
                        value = "1280x720"
                    )
                    
                    Divider(
                        modifier = Modifier.padding(vertical = 12.dp),
                        color = MaterialTheme.colorScheme.surface
                    )
                    
                    SettingsRow(
                        title = "FPS",
                        value = "30"
                    )
                }
            }
        }
        
        // Smart RTL Settings
        item {
            Spacer(modifier = Modifier.height(8.dp))
            SettingsSection(title = "Smart RTL", icon = Icons.Default.Home)
        }
        
        item {
            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant,
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    SettingsRow(
                        title = "Поріг висоти",
                        value = "50 m",
                        subtitle = "Переключення на візуальну навігацію"
                    )
                    
                    Divider(
                        modifier = Modifier.padding(vertical = 12.dp),
                        color = MaterialTheme.colorScheme.surface
                    )
                    
                    SettingsRow(
                        title = "Швидкість повернення",
                        value = "5 m/s"
                    )
                    
                    Divider(
                        modifier = Modifier.padding(vertical = 12.dp),
                        color = MaterialTheme.colorScheme.surface
                    )
                    
                    SettingsRow(
                        title = "Відстань наближення",
                        value = "2 m"
                    )
                }
            }
        }
        
        // About
        item {
            Spacer(modifier = Modifier.height(8.dp))
            SettingsSection(title = "Про додаток", icon = Icons.Default.Info)
        }
        
        item {
            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant,
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    SettingsRow(
                        title = "Версія",
                        value = "1.0.0"
                    )
                    
                    Divider(
                        modifier = Modifier.padding(vertical = 12.dp),
                        color = MaterialTheme.colorScheme.surface
                    )
                    
                    SettingsRow(
                        title = "API URL",
                        value = "https://optical-rtl.emergent.host"
                    )
                }
            }
        }
        
        // Spacer for bottom nav
        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun SettingsSection(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector
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
private fun SettingsSwitch(
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange
        )
    }
}

@Composable
private fun SettingsRow(
    title: String,
    value: String,
    subtitle: String? = null
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge
            )
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = VHCyan
        )
    }
}
