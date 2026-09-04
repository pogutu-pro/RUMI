import subprocess
import sys
import os

def run_command(command, cwd=None):
    """Run a shell command and handle errors."""
    print(f"Running: {''.join(command)}")
    try:
        result = subprocess.run(command, cwd=cwd, check=True)
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        return False
    except FileNotFoundError as e:
        print(f"Command not found: {e}")
        return False

def test_backend():
    """Run backend and database tests."""
    print("\nPreparing Backend & Database Tests...\n")
    # Project root is the parent directory of Backend
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    
    # Try to install missing dependencies
    subprocess.run([sys.executable, "-m", "pip", "install", "pytest", "pytest-django", "pytest-cov", "--user", "--break-system-packages"], 
                   stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
    
    backend_runner = os.path.join(project_root, "Backend/payments/run_backend_tests.py")
    return run_command([sys.executable, backend_runner, "--verbose"], cwd=project_root)

def test_frontend():
    """Run frontend tests."""
    print("\nPreparing Frontend Tests...\n")
    # Project root is the parent directory of Backend
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    frontend_dir = os.path.join(project_root, "frontend")
    
    # Check for pnpm
    try:
        subprocess.run(["pnpm", "--version"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except:
        print("pnpm not found. Please install it first.")
        return False

    # Run frontend test runner
    frontend_runner = os.path.join(frontend_dir, "run_frontend_tests.sh")
    return run_command([frontend_runner], cwd=frontend_dir)

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 test_runner.py backend   - Run backend & database tests")
        print("  python3 test_runner.py frontend  - Run frontend tests")
        sys.exit(1)

    choice = sys.argv[1].lower()
    success = False

    if choice == "backend":
        success = test_backend()
    elif choice == "frontend":
        success = test_frontend()
    else:
        print(f"Unknown option: {choice}")
        print("Use 'backend' or 'frontend'")
        sys.exit(1)

    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()
