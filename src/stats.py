import psutil
import time
import platform
import cpuinfo
import pynvml
_last_net = psutil.net_io_counters()
_last_time = time.time()
import subprocess
# ------------------GPU Static, Get Model name and initialize library -----------------
try:
    import pynvml
    pynvml.nvmlInit()

    handle = pynvml.nvmlDeviceGetHandleByIndex(0)
    mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
    name = pynvml.nvmlDeviceGetName(handle)
    if isinstance(name, bytes):
        name = name.decode()
        
    # Optional Cleanup
    name = name.replace("NVIDIA ", "").strip()
    name = name.replace("GeForce ", "")

    GPU_INFO = {
        "model": name,
        "vram_total": mem.total,
        "clock_max": pynvml.nvmlDeviceGetMaxClockInfo(handle, pynvml.NVML_CLOCK_GRAPHICS)
}

    NVML_AVAILABLE = True

except Exception as e:
    print("NVML nicht verfügbar:", e)

    GPU_INFO = {
        "model": None
    }

    NVML_AVAILABLE = False


# ------------------CPU Static, Get Model name-----------------    
def get_cpu_model():
    try:
        info = cpuinfo.get_cpu_info()
        model = info.get("brand_raw")
        if model:
            model = model.replace("(R)", "").replace("(TM)", "").strip()
            return model
    except Exception:
        pass

    # Fallback (falls cpuinfo aus irgendeinem Grund nicht geht)
    return platform.processor() or "Unknown CPU"


CPU_INFO = {
    "model" : get_cpu_model(),
    "cores_physical" : psutil.cpu_count(logical=False),
    "cores_logical" : psutil.cpu_count(logical=True),
}

# ------------------GPU Static, Get Model name-----------------  
def get_gpu_model():
    try:
        pynvml.nvmlInit()

        handle = pynvml.nvmlDeviceGetHandleByIndex(0)
        name = pynvml.nvmlDeviceGetName(handle)

        if isinstance(name, bytes):
            name = name.decode()

        return name.replace("(R)", "").replace("(TM)", "").strip()

    except Exception:
        return "Unknown GPU"


# ------------------RAM Static, max RAM----------------- 
RAM_INFO = {
    "total" : psutil.virtual_memory().total
}
# ------------------CPU dynamic-----------------

def get_cpu_stats():
    temp = None

    return {
        "load": psutil.cpu_percent(interval=0.5),
    
    }

# ------------------RAM dynamic-----------------
def get_ram_stats():
    ram = psutil.virtual_memory()
    return {
        "load" : ram.percent,
        "free" : ram.available,
        "used" : ram.used
    }

# ------------------GPU dynamic-----------------

def get_gpu_stats():
    if not NVML_AVAILABLE:
        return {
            "load": None,
            "temperature": None
        }

    try:
        handle = pynvml.nvmlDeviceGetHandleByIndex(0)
        mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
        util = pynvml.nvmlDeviceGetUtilizationRates(handle)
        temp = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)

        return {
            "load": util.gpu,
            "temperature": temp,
            "clock_current": pynvml.nvmlDeviceGetClockInfo(handle, pynvml.NVML_CLOCK_GRAPHICS),
            "used": mem.used,
            "total": mem.total,
            "gpu_percent": (mem.used / mem.total) * 100

        }

    except Exception as e:
        print("GPU-Fehler:", e)
        return {
            "load": None,
            "temperature": None,
            "clock_current": None
        }
# ------------------Network Traffic dynamic-----------------

def get_network_stats():
    global _last_net, _last_time

    current_net = psutil.net_io_counters()
    current_time = time.time()

    time_diff = current_time - _last_time

    if time_diff == 0:
        return {"up": 0, "down": 0}

    bytes_sent = current_net.bytes_sent - _last_net.bytes_sent
    bytes_recv = current_net.bytes_recv - _last_net.bytes_recv

    up = (bytes_sent * 8) / time_diff / 1024 / 1024    # Mbps
    down = (bytes_recv * 8) / time_diff / 1024 / 1024  # Mbps

    _last_net = current_net
    _last_time = current_time

    return {
        "up": max(0, up),
        "down": max(0, down)
    }



def get_ping(host="8.8.8.8"):
    try:
        result = subprocess.run(
            ["ping", "-n", "1", host],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore"
        )

        for line in result.stdout.split("\n"):
            if "Zeit=" in line:
                return float(line.split("Zeit=")[1].split("ms")[0])

            if "time=" in line:
                return float(line.split("time=")[1].split("ms")[0])

    except Exception as e:
        print("Ping Fehler:", e)

    return 0   # 🔥 NICHT None → UI bleibt stabil


def safe_network_stats():
    try:
        net = get_network_stats()
        ping = get_ping()

        return {
            "up": net.get("up", 0),
            "down": net.get("down", 0),
            "ping": ping if ping is not None else 0
        }

    except Exception as e:
        print("Network Fehler:", e)
        return {
            "up": 0,
            "down": 0,
            "ping": 0
        }

# ------------------Collect all stats centrally-----------------
def collect_stats():
    cpu_stats = get_cpu_stats()
    ram_stats = get_ram_stats()
    gpu_stats = get_gpu_stats()
    net_stats = get_network_stats()

    return {
        "cpu": {
            **cpu_stats,
            "info": CPU_INFO
        },
        "ram": {
            **ram_stats,
            "info": RAM_INFO
        },
        "gpu": {
            **gpu_stats,
            "info": GPU_INFO
        },
        "network": safe_network_stats(),
        "timestamp": time.time()
}
