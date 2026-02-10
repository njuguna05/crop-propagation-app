
import asyncio
import httpx
import sys

BASE_URL = "http://localhost:8001/api/v1"

# Test Data
USER_EMAIL = "testverify@example.com"
USER_PASSWORD = "password123"
TENANT_1_NAME = "Tenant One"
TENANT_1_SUBDOMAIN = "tenant-one"
TENANT_2_NAME = "Tenant Two"
TENANT_2_SUBDOMAIN = "tenant-two"

async def run_verification():
    async with httpx.AsyncClient() as client:
        print("1. Registering User...")
        resp = await client.post(f"{BASE_URL}/auth/register", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "username": "testverify",
            "first_name": "Test",
            "last_name": "Verify"
        })
        if resp.status_code == 400 and "already exists" in resp.text:
            print("   User already exists, continuing...")
        elif resp.status_code != 200:
            print(f"   Failed to register: {resp.text}")
            return
        
        print("2. Logging In...")
        resp = await client.post(f"{BASE_URL}/auth/login", json={
            "username": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if resp.status_code != 200:
            print(f"   Failed to login: {resp.text}")
            return
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("   Login successful.")

        print("3. Creating Tenant 1...")
        resp = await client.post(f"{BASE_URL}/tenants/", json={
            "name": TENANT_1_NAME,
            "subdomain": TENANT_1_SUBDOMAIN,
            "plan": "free"
        }, headers=headers)
        
        tenant1_id = None
        if resp.status_code == 200:
            tenant1_id = resp.json()["id"]
            print(f"   Tenant 1 created with ID: {tenant1_id}")
        elif resp.status_code == 400 and "already exists" in resp.text:
             # Let's try to list tenants to find it
             pass
        else:
             print(f"   Failed to create Tenant 1: {resp.text}")

        # If we failed to create, let's list tenants to find our tenant
        if not tenant1_id:
            resp = await client.get(f"{BASE_URL}/tenants/", headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                tenants = data.get("tenants", [])
                for t in tenants:
                    if t["subdomain"] == TENANT_1_SUBDOMAIN:
                        tenant1_id = t["id"]
                        print(f"   Found existing Tenant 1 ID: {tenant1_id}")
                        break
        
        if not tenant1_id:
            print("   Could not obtain Tenant 1 ID. Aborting.")
            return

        print("4. Creating Tenant 2...")
        resp = await client.post(f"{BASE_URL}/tenants/", json={
            "name": TENANT_2_NAME,
            "subdomain": TENANT_2_SUBDOMAIN,
            "plan": "free"
        }, headers=headers)
        
        tenant2_id = None
        if resp.status_code == 200:
            tenant2_id = resp.json()["id"]
            print(f"   Tenant 2 created with ID: {tenant2_id}")
        elif resp.status_code == 400:
             pass # Logic to find it below
        
        if not tenant2_id:
            resp = await client.get(f"{BASE_URL}/tenants/", headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                tenants = data.get("tenants", [])
                for t in tenants:
                    if t["subdomain"] == TENANT_2_SUBDOMAIN:
                        tenant2_id = t["id"]
                        print(f"   Found existing Tenant 2 ID: {tenant2_id}")
                        break

        if not tenant2_id:
            print("   Could not obtain Tenant 2 ID. Aborting.")
            return

        print(f"5. Creating Crop in Tenant 1 (ID: {tenant1_id})...")
        headers_t1 = headers.copy()
        headers_t1["X-Tenant-ID"] = str(tenant1_id)
        
        resp = await client.post(f"{BASE_URL}/crops/", json={
            "name": "Tenant 1 Crop",
            "variety": "T1 Variety",
            "propagation_method": "seed",
            "target_days": 30
        }, headers=headers_t1)
        
        if resp.status_code != 200:
            print(f"   Failed to create crop in Tenant 1: {resp.text}")
            return
        
        crop1 = resp.json()
        crop1_id = crop1["id"]
        print(f"   Crop created: {crop1['name']} (ID: {crop1_id})")

        print(f"6. Verifying Data Isolation...")
        
        # Check Tenant 1 can see it
        resp = await client.get(f"{BASE_URL}/crops/", headers=headers_t1)
        t1_crops = resp.json()
        found_in_t1 = any(c['id'] == crop1_id for c in t1_crops)
        print(f"   Crop found in Tenant 1? {found_in_t1}")
        
        # Check Tenant 2 CANNOT see it
        headers_t2 = headers.copy()
        headers_t2["X-Tenant-ID"] = str(tenant2_id)
        resp = await client.get(f"{BASE_URL}/crops/", headers=headers_t2)
        t2_crops = resp.json()
        found_in_t2 = any(c['id'] == crop1_id for c in t2_crops)
        print(f"   Crop found in Tenant 2? {found_in_t2}")

        if found_in_t1 and not found_in_t2:
            print("SUCCESS: Data is strictly isolated between tenants.")
        else:
            print("FAILURE: Data isolation check failed.")

        print("7. Verifying Unauthorized Access...")
        # Trying to access Tenant 1's crop using Tenant 2's context by ID
        resp = await client.get(f"{BASE_URL}/crops/{crop1_id}", headers=headers_t2)
        if resp.status_code == 404:
            print("   SUCCESS: Tenant 2 received 404 when directly accessing Tenant 1's crop.")
        else:
             print(f"   FAILURE: Tenant 2 could access Tenant 1's crop. Status: {resp.status_code}")

if __name__ == "__main__":
    asyncio.run(run_verification())
