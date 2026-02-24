import { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import axios from "axios";
import RouteMap3D from "./components/RouteMap3D";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Documentation viewer component
const DocViewer = ({ doc }) => {
  if (!doc) {
    return (
      <div className="doc-placeholder" data-testid="doc-placeholder">
        <div className="placeholder-icon">📄</div>
        <p>Виберіть документ зі списку</p>
      </div>
    );
  }

  return (
    <div className="doc-content" data-testid="doc-content">
      <div 
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: doc.html }}
      />
    </div>
  );
};

// File tree component
const FileTree = ({ files, onSelect, selectedPath }) => {
  const grouped = {};
  files.forEach(f => {
    const parts = f.split('/');
    const folder = parts.length > 1 ? parts[0] : 'root';
    if (!grouped[folder]) grouped[folder] = [];
    grouped[folder].push(f);
  });

  return (
    <div className="file-tree" data-testid="file-tree">
      {Object.entries(grouped).map(([folder, items]) => (
        <div key={folder} className="tree-folder">
          <div className="folder-name">📁 {folder}</div>
          {items.map(item => (
            <div
              key={item}
              className={`tree-file ${selectedPath === item ? 'selected' : ''}`}
              onClick={() => onSelect(item)}
            >
              {item.endsWith('.py') ? '🐍' : 
               item.endsWith('.cpp') || item.endsWith('.hpp') ? '⚙️' :
               item.endsWith('.sh') ? '📜' : '📄'} {item.split('/').pop()}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Code viewer component
const CodeViewer = ({ code, path }) => {
  if (!code) {
    return (
      <div className="code-placeholder" data-testid="code-placeholder">
        <div className="placeholder-icon">💻</div>
        <p>Виберіть файл для перегляду коду</p>
      </div>
    );
  }

  return (
    <div className="code-viewer" data-testid="code-viewer">
      <div className="code-header">{path}</div>
      <pre className="code-content">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// 3D Map Panel component
const MapPanel = () => {
  const [route, setRoute] = useState(null);
  const [dronePosition, setDronePosition] = useState({ x: 0, y: 0, z: 5, yaw: 0 });
  const [mode, setMode] = useState('IDLE');
  const [isSimulating, setIsSimulating] = useState(false);
  const [followDrone, setFollowDrone] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [selectedKeyframe, setSelectedKeyframe] = useState(null);
  const animationRef = useRef(null);
  const progressRef = useRef(0);

  // Load demo route
  const loadDemoRoute = async () => {
    try {
      const response = await axios.get(`${API}/routes/demo/generate`);
      setRoute(response.data);
    } catch (e) {
      console.error("Failed to load demo route:", e);
    }
  };

  useEffect(() => {
    loadDemoRoute();
  }, []);

  // Start simulation
  const startSimulation = useCallback(() => {
    if (!route || !route.points || route.points.length === 0) return;
    
    setIsSimulating(true);
    setMode('RETURNING');
    progressRef.current = 0;
    
    const animate = () => {
      if (!route?.points) return;
      
      progressRef.current += 0.5;
      const progress = progressRef.current;
      const totalPoints = route.points.length;
      const currentIndex = Math.min(Math.floor(progress), totalPoints - 1);
      
      if (currentIndex >= totalPoints - 1) {
        setIsSimulating(false);
        setMode('IDLE');
        setSimulationProgress(100);
        return;
      }
      
      const point = route.points[currentIndex];
      setDronePosition({
        x: point.x,
        y: point.y,
        z: point.z,
        yaw: point.yaw || 0
      });
      setSimulationProgress((currentIndex / totalPoints) * 100);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [route]);

  // Stop simulation
  const stopSimulation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsSimulating(false);
    setMode('IDLE');
  };

  // Reset view
  const resetView = () => {
    setDronePosition({ x: 0, y: 0, z: 5, yaw: 0 });
    setSimulationProgress(0);
    progressRef.current = 0;
  };

  // Handle keyframe selection
  const handleKeyframeSelect = (kf, index) => {
    setSelectedKeyframe({ ...kf, index });
    setDronePosition({ x: kf.x, y: kf.y, z: kf.z, yaw: kf.yaw || 0 });
  };

  return (
    <div className="map-panel" data-testid="map-panel">
      {/* Controls */}
      <div className="map-controls">
        <div className="control-section">
          <h3>🎮 Керування</h3>
          <div className="control-buttons">
            <button 
              className={`map-btn ${isSimulating ? 'active' : ''}`}
              onClick={isSimulating ? stopSimulation : startSimulation}
              disabled={!route}
              data-testid="simulation-btn"
            >
              {isSimulating ? '⏹ Стоп' : '▶ Симуляція'}
            </button>
            <button 
              className="map-btn"
              onClick={resetView}
              data-testid="reset-btn"
            >
              🔄 Скинути
            </button>
            <button 
              className="map-btn"
              onClick={loadDemoRoute}
              data-testid="load-demo-btn"
            >
              📍 Новий маршрут
            </button>
          </div>
        </div>

        <div className="control-section">
          <h3>📷 Камера</h3>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={followDrone}
              onChange={(e) => setFollowDrone(e.target.checked)}
            />
            Слідувати за дроном
          </label>
        </div>

        <div className="control-section">
          <h3>📊 Статистика</h3>
          <div className="stats-list">
            <div className="stat-item">
              <span>Режим:</span>
              <span className={`mode-badge mode-${mode.toLowerCase()}`}>{mode}</span>
            </div>
            <div className="stat-item">
              <span>Прогрес:</span>
              <span>{simulationProgress.toFixed(1)}%</span>
            </div>
            <div className="stat-item">
              <span>Позиція X:</span>
              <span>{dronePosition.x.toFixed(1)}m</span>
            </div>
            <div className="stat-item">
              <span>Позиція Y:</span>
              <span>{dronePosition.y.toFixed(1)}m</span>
            </div>
            <div className="stat-item">
              <span>Висота:</span>
              <span>{dronePosition.z.toFixed(1)}m</span>
            </div>
            {route && (
              <>
                <div className="stat-item">
                  <span>Keyframes:</span>
                  <span>{route.keyframes?.length || 0}</span>
                </div>
                <div className="stat-item">
                  <span>Дистанція:</span>
                  <span>{route.total_distance?.toFixed(1) || 0}m</span>
                </div>
              </>
            )}
          </div>
        </div>

        {selectedKeyframe && (
          <div className="control-section">
            <h3>📍 Keyframe #{selectedKeyframe.index + 1}</h3>
            <div className="stats-list">
              <div className="stat-item">
                <span>X:</span>
                <span>{selectedKeyframe.x.toFixed(2)}m</span>
              </div>
              <div className="stat-item">
                <span>Y:</span>
                <span>{selectedKeyframe.y.toFixed(2)}m</span>
              </div>
              <div className="stat-item">
                <span>Z:</span>
                <span>{selectedKeyframe.z.toFixed(2)}m</span>
              </div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {isSimulating && (
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${simulationProgress}%` }}
              />
            </div>
            <span className="progress-text">{simulationProgress.toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* 3D Canvas */}
      <div className="map-canvas" data-testid="map-canvas">
        <RouteMap3D
          route={route}
          dronePosition={dronePosition}
          mode={mode}
          followDrone={followDrone}
          onKeyframeSelect={handleKeyframeSelect}
        />
      </div>
    </div>
  );
};

// Main App
function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent] = useState(null);
  const [firmware, setFirmware] = useState({ python: [], cpp: [], scripts: [], config: [] });
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load documentation list
  useEffect(() => {
    const loadDocs = async () => {
      try {
        const response = await axios.get(`${API}/docs/list`);
        setDocs(response.data);
      } catch (e) {
        console.error("Failed to load docs:", e);
      }
    };
    loadDocs();
  }, []);

  // Load firmware structure
  useEffect(() => {
    const loadFirmware = async () => {
      try {
        const response = await axios.get(`${API}/firmware/structure`);
        setFirmware(response.data);
      } catch (e) {
        console.error("Failed to load firmware structure:", e);
      }
    };
    loadFirmware();
  }, []);

  // Load selected document
  const loadDoc = useCallback(async (filename) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/docs/${filename}`);
      setDocContent(response.data);
    } catch (e) {
      console.error("Failed to load doc:", e);
    }
    setLoading(false);
  }, []);

  // Load selected file
  const loadFile = useCallback(async (filepath) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/firmware/file/${filepath}`);
      setFileContent(response.data.content);
    } catch (e) {
      console.error("Failed to load file:", e);
    }
    setLoading(false);
  }, []);

  const handleDocSelect = (doc) => {
    setSelectedDoc(doc.name);
    loadDoc(doc.name);
  };

  const handleFileSelect = (path) => {
    setSelectedFile(path);
    loadFile(path);
  };

  const allFirmwareFiles = [
    ...firmware.python,
    ...firmware.cpp,
    ...firmware.scripts,
    ...firmware.config
  ];

  return (
    <div className="app" data-testid="app-container">
      {/* Header */}
      <header className="header" data-testid="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🛩️</span>
            <h1>Visual Homing</h1>
            <span className="version">v1.0</span>
          </div>
          <nav className="nav-tabs">
            <button
              className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
              data-testid="tab-map"
            >
              🗺️ 3D Карта
            </button>
            <button
              className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
              onClick={() => setActiveTab('docs')}
              data-testid="tab-docs"
            >
              📚 Документація
            </button>
            <button
              className={`tab-btn ${activeTab === 'firmware' ? 'active' : ''}`}
              onClick={() => setActiveTab('firmware')}
              data-testid="tab-firmware"
            >
              💾 Прошивка
            </button>
            <button
              className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
              data-testid="tab-about"
            >
              ℹ️ Про проект
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'map' && (
          <MapPanel />
        )}

        {activeTab === 'docs' && (
          <div className="docs-layout" data-testid="docs-section">
            {/* Sidebar */}
            <aside className="sidebar">
              <div className="sidebar-header">
                <h2>📖 Документи</h2>
              </div>
              <div className="doc-list">
                {docs.map(doc => (
                  <div
                    key={doc.name}
                    className={`doc-item ${selectedDoc === doc.name ? 'active' : ''}`}
                    onClick={() => handleDocSelect(doc)}
                    data-testid={`doc-item-${doc.name}`}
                  >
                    <span className="doc-icon">📄</span>
                    <span className="doc-title">{doc.title}</span>
                  </div>
                ))}
              </div>
            </aside>

            {/* Content */}
            <section className="content-area">
              {loading ? (
                <div className="loading">Завантаження...</div>
              ) : (
                <DocViewer doc={docContent} />
              )}
            </section>
          </div>
        )}

        {activeTab === 'firmware' && (
          <div className="firmware-layout" data-testid="firmware-section">
            {/* File browser */}
            <aside className="sidebar">
              <div className="sidebar-header">
                <h2>📁 Файли прошивки</h2>
              </div>
              <FileTree
                files={allFirmwareFiles}
                onSelect={handleFileSelect}
                selectedPath={selectedFile}
              />
            </aside>

            {/* Code viewer */}
            <section className="content-area">
              {loading ? (
                <div className="loading">Завантаження...</div>
              ) : (
                <CodeViewer code={fileContent} path={selectedFile} />
              )}
            </section>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="about-section" data-testid="about-section">
            <div className="about-card">
              <div className="about-header">
                <span className="about-icon">🛩️</span>
                <h2>Visual Homing System</h2>
              </div>
              
              <div className="about-content">
                <p className="about-desc">
                  Система візуальної навігації для мультикоптерних дронів на базі ArduPilot.
                  Працює за принципом оптичної комп'ютерної мишки — записує візуальні орієнтири
                  під час польоту та використовує їх для автономного повернення на точку зльоту.
                </p>

                <div className="features-grid">
                  <div className="feature-card">
                    <span className="feature-icon">📍</span>
                    <h3>Без GPS залежності</h3>
                    <p>Навігація по візуальних орієнтирах, стійкість до GPS спуфінгу</p>
                  </div>
                  <div className="feature-card">
                    <span className="feature-icon">🧭</span>
                    <h3>Без компаса</h3>
                    <p>Орієнтація визначається візуально, немає магнітних інтерференцій</p>
                  </div>
                  <div className="feature-card">
                    <span className="feature-icon">🔄</span>
                    <h3>Teach & Repeat</h3>
                    <p>Запис маршруту під час польоту, повернення по записаному шляху</p>
                  </div>
                  <div className="feature-card">
                    <span className="feature-icon">🌡️</span>
                    <h3>Термальна камера</h3>
                    <p>Підтримка Caddx Thermal 256 для нічного бачення</p>
                  </div>
                </div>

                <div className="specs-table">
                  <h3>Специфікації</h3>
                  <table>
                    <tbody>
                      <tr><td>Комп'ютер</td><td>Raspberry Pi Zero 2 W</td></tr>
                      <tr><td>Камера</td><td>Caddx Thermal 256 / Pi Camera</td></tr>
                      <tr><td>Політний контролер</td><td>Matek (ArduCopter 4.5.7)</td></tr>
                      <tr><td>Протокол</td><td>MAVLink 2 (UART 115200)</td></tr>
                      <tr><td>Мови</td><td>Python 3 / C++17</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer" data-testid="footer">
        <p>Visual Homing System • ArduPilot + Raspberry Pi Zero 2 W • MIT License</p>
      </footer>
    </div>
  );
}

export default App;
