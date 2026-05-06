import psutil
import time
import platform

# ------------------GPU Static, Get Model name and initialize library -----------------
try:
    import pynvml
    pynvml.nvmlInit()

    handle = pynvml.nvmlDeviceGetHandleByIndex(0)
    mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
    GPU_INFO = {
        "model": pynvml.nvmlDeviceGetName(handle).decode(),
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
CPU_INFO = {
    "model" : platform.processor() or platform.machine(),
    "cores_physical" : psutil.cpu_count(logical=False),
    "cores_logical" : psutil.cpu_count(logical=True),
}


# ------------------RAM Static, max RAM----------------- 
RAM_INFO = {
    "total" : psutil.virtual_memory().total
}
# ------------------CPU dynamic-----------------

def get_cpu_stats():
    temp = None

    try:
        temps = psutil.sensors_temperatures()
        if "coretemp" in temps and len(temps["coretemp"]) > 0:
            # höchste Core-Temperatur nehmen
            temp = max(t.current for t in temps["coretemp"])
    except Exception:
        temp = None

    return {
        "load": psutil.cpu_percent(interval=0.5),
        "temperature": temp
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


# ------------------Collect all stats centrally-----------------
def collect_stats():
    cpu_stats = get_cpu_stats()
    ram_stats = get_ram_stats()
    gpu_stats = get_gpu_stats()

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
        "timestamp": time.time()
    }