import psutil
import time

try:
    import pynvml
    pynvml.nvmlInit()
    NVML_AVAILABLE = True
except Exception as e:
    print("NVML nicht verfügbar:", e)
    NVML_AVAILABLE = False

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
    if not NVML_AVAILABLE:
        return {
            "load": None,
            "temperature": None
        }

    try:
        handle = pynvml.nvmlDeviceGetHandleByIndex(0)

        util = pynvml.nvmlDeviceGetUtilizationRates(handle)
        temp = pynvml.nvmlDeviceGetTemperature(
            handle, pynvml.NVML_TEMPERATURE_GPU
        )

        return {
            "load": util.gpu,
            "temperature": temp
        }

    except Exception as e:
        print("GPU-Fehler:", e)
        return {
            "load": None,
            "temperature": None
        }



def collect_stats():
    return {
        "cpu": get_cpu_stats(),
        "ram": get_ram_stats(),
        "gpu": get_gpu_stats(),
        "timestamp": time.time()
    }