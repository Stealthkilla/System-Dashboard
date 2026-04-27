import psutil
import time


try:
    import pynvml
    NVIDIA_AVAILABLE = True
except ImportError:
    NVIDIA_AVAILABLE = False

def get_cpu_usage():
    return psutil.cpu_percent(interval=1)


def get_ram_usage():
    ram = psutil.virtual_memory()
    return ram.percent


def init_gpu():
    if NVIDIA_AVAILABLE:
        pynvml.nvmlInit()


def get_gpu_stats():
    if not NVIDIA_AVAILABLE:
        return None

    handle = pynvml.nvmlDeviceGetHandleByIndex(0)
    util = pynvml.nvmlDeviceGetUtilizationRates(handle)
    mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
    temp = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)

    return {
        "gpu_load": util.gpu,                # %
        "vram_used": mem.used // (1024**2),  # MB
        "vram_total": mem.total // (1024**2),
        "temperature": temp                 # °C
    }


def main():
    init_gpu()

    while True:
        cpu = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory().percent
        gpu = get_gpu_stats()

        if gpu:
            print(
                f"CPU {cpu:5.1f}% | RAM {ram:5.1f}% | "
                f"GPU {gpu['gpu_load']:3d}% | "
                f"VRAM {gpu['vram_used']}/{gpu['vram_total']} MB | "
                f"GPU Temp {gpu['temperature']}°C"
            )
        else:
            print(f"CPU {cpu:5.1f}% | RAM {ram:5.1f}% | GPU: n/a")

        time.sleep(1)





if __name__ == "__main__":
    main()
