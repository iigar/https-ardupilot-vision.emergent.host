import { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import axios from "axios";
import SimpleMap3D from "./components/SimpleMap3D";

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

// 3D Map Panel component - simplified wrapper
const MapPanel = () => {
  return (
    <div className="map-panel-full" data-testid="map-panel">
      <SimpleMap3D />
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
