import pytest
import requests
import os

# Get backend URL from environment or use public preview URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://optical-flow-drone.preview.emergentagent.com').rstrip('/')


class TestRootAPI:
    """Test root API endpoint"""
    
    def test_root_endpoint(self, api_client):
        """Test GET /api/ returns API info"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Visual Homing API"
        assert "version" in data
        assert data["version"] == "1.0"


class TestDocumentation:
    """Test documentation endpoints"""
    
    def test_docs_list_returns_array(self, api_client):
        """Test GET /api/docs/list returns array of documents"""
        response = api_client.get(f"{BASE_URL}/api/docs/list")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_docs_list_has_required_fields(self, api_client):
        """Test each document has name, path, and title"""
        response = api_client.get(f"{BASE_URL}/api/docs/list")
        assert response.status_code == 200
        data = response.json()
        
        for doc in data:
            assert "name" in doc, f"Document missing 'name' field: {doc}"
            assert "path" in doc, f"Document missing 'path' field: {doc}"
            assert "title" in doc, f"Document missing 'title' field: {doc}"
            assert doc["name"].endswith(".md"), f"Document name should be .md file: {doc['name']}"
    
    def test_get_single_doc(self, api_client):
        """Test GET /api/docs/{filename} returns document content"""
        # First get the list
        list_response = api_client.get(f"{BASE_URL}/api/docs/list")
        docs = list_response.json()
        
        if len(docs) > 0:
            # Get first document
            doc_name = docs[0]["name"]
            response = api_client.get(f"{BASE_URL}/api/docs/{doc_name}")
            assert response.status_code == 200
            data = response.json()
            assert "name" in data
            assert "title" in data
            assert "content" in data
            assert "html" in data
            assert len(data["content"]) > 0
            assert len(data["html"]) > 0


class TestRoutes:
    """Test flight routes endpoints"""
    
    def test_demo_route_generate(self, api_client):
        """Test GET /api/routes/demo/generate returns route data"""
        response = api_client.get(f"{BASE_URL}/api/routes/demo/generate")
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "id" in data
        assert "name" in data
        assert "points" in data
        assert "keyframes" in data
        assert "total_distance" in data
        assert "created_at" in data
    
    def test_demo_route_has_points(self, api_client):
        """Test demo route has correct number of points"""
        response = api_client.get(f"{BASE_URL}/api/routes/demo/generate")
        data = response.json()
        
        assert len(data["points"]) == 100, "Should have 100 route points"
        
        # Verify point structure
        first_point = data["points"][0]
        assert "x" in first_point
        assert "y" in first_point
        assert "z" in first_point
        assert "yaw" in first_point
        assert "timestamp" in first_point
        assert "is_keyframe" in first_point
    
    def test_demo_route_has_keyframes(self, api_client):
        """Test demo route has correct number of keyframes"""
        response = api_client.get(f"{BASE_URL}/api/routes/demo/generate")
        data = response.json()
        
        # Should have 10 keyframes (every 10th point)
        assert len(data["keyframes"]) == 10, "Should have 10 keyframes"
        
        # All keyframes should have is_keyframe=True
        for kf in data["keyframes"]:
            assert kf["is_keyframe"] == True
    
    def test_demo_route_total_distance(self, api_client):
        """Test demo route has calculated total distance"""
        response = api_client.get(f"{BASE_URL}/api/routes/demo/generate")
        data = response.json()
        
        # Should have a positive distance
        assert data["total_distance"] > 0
        # Reasonable range for spiral route (should be ~300-500m)
        assert data["total_distance"] > 200
        assert data["total_distance"] < 1000
    
    def test_routes_list(self, api_client):
        """Test GET /api/routes returns list"""
        response = api_client.get(f"{BASE_URL}/api/routes")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_create_and_delete_route(self, api_client):
        """Test POST /api/routes creates route and DELETE removes it"""
        test_route = {
            "id": f"test_route_{int(__import__('time').time() * 1000)}",
            "name": "TEST_Pytest_Route",
            "points": [{"x": 0, "y": 0, "z": 5, "yaw": 0, "timestamp": 0, "is_keyframe": True}],
            "keyframes": [{"x": 0, "y": 0, "z": 5, "yaw": 0, "timestamp": 0, "is_keyframe": True}],
            "total_distance": 100.0,
            "created_at": "2026-02-24T00:00:00Z"
        }
        
        # Create route
        create_response = api_client.post(f"{BASE_URL}/api/routes", json=test_route)
        assert create_response.status_code == 200
        create_data = create_response.json()
        assert create_data["success"] == True
        assert create_data["id"] == test_route["id"]
        
        # Verify in list
        list_response = api_client.get(f"{BASE_URL}/api/routes")
        routes = list_response.json()
        found = [r for r in routes if r["id"] == test_route["id"]]
        assert len(found) == 1
        assert found[0]["name"] == test_route["name"]
        
        # Get single route
        get_response = api_client.get(f"{BASE_URL}/api/routes/{test_route['id']}")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["id"] == test_route["id"]
        assert get_data["name"] == test_route["name"]
        
        # Delete route
        delete_response = api_client.delete(f"{BASE_URL}/api/routes/{test_route['id']}")
        assert delete_response.status_code == 200
        delete_data = delete_response.json()
        assert delete_data["success"] == True
        
        # Verify deleted
        list_after_delete = api_client.get(f"{BASE_URL}/api/routes")
        routes_after = list_after_delete.json()
        not_found = [r for r in routes_after if r["id"] == test_route["id"]]
        assert len(not_found) == 0

    def test_delete_nonexistent_route(self, api_client):
        """Test DELETE /api/routes/{id} for non-existent route returns error"""
        response = api_client.delete(f"{BASE_URL}/api/routes/nonexistent_route_12345")
        assert response.status_code == 200  # API returns 200 with error message
        data = response.json()
        assert "error" in data



class TestDronePosition:
    """Test drone position endpoints"""
    
    def test_get_position(self, api_client):
        """Test GET /api/position returns drone position"""
        response = api_client.get(f"{BASE_URL}/api/position")
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "x" in data
        assert "y" in data
        assert "z" in data
        assert "yaw" in data
        assert "pitch" in data
        assert "roll" in data
        assert "speed" in data
        assert "mode" in data
    
    def test_post_position(self, api_client):
        """Test POST /api/position updates position"""
        new_position = {
            "x": 10.5,
            "y": 20.3,
            "z": 15.0,
            "yaw": 1.5,
            "pitch": 0.1,
            "roll": 0.2,
            "speed": 5.0,
            "mode": "FLYING"
        }
        
        response = api_client.post(f"{BASE_URL}/api/position", json=new_position)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        
        # Verify position was updated by GET
        get_response = api_client.get(f"{BASE_URL}/api/position")
        updated_data = get_response.json()
        assert updated_data["x"] == new_position["x"]
        assert updated_data["y"] == new_position["y"]
        assert updated_data["z"] == new_position["z"]
        assert updated_data["mode"] == new_position["mode"]


class TestSimulation:
    """Test simulation endpoints"""
    
    def test_start_simulation(self, api_client):
        """Test GET /api/simulation/start/{route_id} returns message"""
        response = api_client.get(f"{BASE_URL}/api/simulation/start/demo_route_001")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "route_id" in data
        assert data["route_id"] == "demo_route_001"


class TestFirmware:
    """Test firmware endpoints"""
    
    def test_firmware_structure(self, api_client):
        """Test GET /api/firmware/structure returns file structure"""
        response = api_client.get(f"{BASE_URL}/api/firmware/structure")
        assert response.status_code == 200
        data = response.json()
        
        # Check expected categories
        assert "python" in data
        assert "cpp" in data
        assert "scripts" in data
        assert "config" in data
        
        # Should have some files
        total_files = len(data["python"]) + len(data["cpp"]) + len(data["scripts"]) + len(data["config"])
        assert total_files > 0, "Should have some firmware files"
