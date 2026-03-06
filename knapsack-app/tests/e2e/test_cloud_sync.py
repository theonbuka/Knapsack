import os
from pathlib import Path

import pytest
from playwright.sync_api import Browser, Page, expect

BASE_URL = os.getenv("E2E_BASE_URL", "http://localhost:5177")


def cloud_env_configured() -> bool:
    env_path = Path(__file__).resolve().parents[2] / ".env.local"
    if not env_path.exists():
        return False

    content = env_path.read_text(encoding="utf-8")
    if "your-project-id.supabase.co" in content:
        return False
    if "your-anon-public-key" in content:
        return False

    required_keys = ["VITE_SUPABASE_URL=", "VITE_SUPABASE_ANON_KEY="]
    return all(key in content for key in required_keys)


pytestmark = pytest.mark.skipif(
    not cloud_env_configured(),
    reason="Cloud sync test requires real Supabase values in .env.local",
)


def register_user(page: Page, email: str, password: str) -> None:
    page.goto(f"{BASE_URL}/landing")
    page.wait_for_load_state("networkidle")

    page.get_by_role("button", name="Kayıt Ol", exact=True).first.click()
    page.locator("input[placeholder='Soyisim']").wait_for(state="visible")
    page.locator("input[placeholder='İsim']").fill("Cloud")
    page.locator("input[placeholder='Soyisim']").fill("Sync")
    page.get_by_placeholder("Email").fill(email)
    page.get_by_placeholder("Şifre").fill(password)
    page.get_by_role("button", name="Hesap Oluştur").click()

    page.wait_for_url(f"{BASE_URL}/")
    page.wait_for_load_state("networkidle")


def add_transaction(page: Page, title: str) -> None:
    page.goto(f"{BASE_URL}/transactions")
    page.wait_for_load_state("networkidle")
    page.get_by_label("Create new transaction").click()
    page.get_by_placeholder("0").fill("777")
    page.get_by_placeholder("Başlık").fill(title)
    page.get_by_placeholder("Not ekle (opsiyonel)").fill("cloud sync smoke")
    page.get_by_role("button", name="Kaydet").click()


def test_cloud_sync_between_two_sessions(browser: Browser) -> None:
    email = f"sync-{os.getpid()}-{os.urandom(2).hex()}@knapsack.local"
    password = "123456"
    unique_title = f"Cloud TX {os.urandom(2).hex()}"

    context_a = browser.new_context()
    context_b = browser.new_context()

    try:
        page_a = context_a.new_page()
        page_b = context_b.new_page()

        register_user(page_a, email, password)
        register_user(page_b, email, password)

        add_transaction(page_a, unique_title)

        # Debounced cloud push runs shortly after local save.
        page_a.wait_for_timeout(2500)

        page_b.goto(f"{BASE_URL}/transactions")
        page_b.wait_for_load_state("networkidle")
        page_b.reload()
        page_b.wait_for_load_state("networkidle")

        expect(page_b.get_by_text(unique_title)).to_be_visible(timeout=10000)
    finally:
        context_a.close()
        context_b.close()
