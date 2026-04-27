import psutil
import time


def get_cpu_usage():
    return psutil.cpu_percent(interval=1)


def get_ram_usage():
    ram = psutil.virtual_memory()
    return ram.percent


def main():
    while True:
        cpu = get_cpu_usage()
        ram = get_ram_usage()

        print(f"CPU-Auslastung: {cpu:5.1f} % | RAM-Auslastung: {ram:5.1f} %")
        time.sleep(1)


if __name__ == "__main__":
    main()
