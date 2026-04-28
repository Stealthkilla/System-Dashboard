
from stats import init_gpu
from server import run_server


def main():
    init_gpu()      # Initialisierung GPU
    run_server()    # Startet Server


if __name__ == "__main__":
    main()
