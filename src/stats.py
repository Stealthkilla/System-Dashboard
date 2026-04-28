import psutil
import time

try:
    import pynvml
    NVIDIA_AVAILABLE = True
except ImportError:
    NVIDIA_AVAILABLE = False


def init_gpu():
    if NVIDIA_AVAILABLE:
        pynvml.nvmlInit()


def get_cpu_stats():
    return {
        "load": psutil.cpu_percent(interval=0.5)
    }


def get_ram_stats():
    ram = psutil.virtual_memory()
    return {
        "load": ram.percent
    }


def get_gpu_stats():
    if not NVIDIA_AVAILABLE:
        return None

    handle = pynvml.nvmlDeviceGetHandleByIndex(0)

    util = pynvml.nvmlDeviceGetUtilizationRates(handle)
    mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
    temp = pynvml.nvmlDeviceGetTemperature(
        handle, pynvml.NVML_TEMPERATURE_GPU
    )

    return {
        "load": util.gpu,
        "temperature": temp,
        "vram": {
            "used": mem.used // (1024 ** 2),
            "total": mem.total // (1024 ** 2)
        }
    }


def collect_stats():
    return {
        "cpu": get_cpu_stats(),
        "ram": get_ram_stats(),
        "gpu": get_gpu_stats(),
        "timestamp": int(time.time())
    }
