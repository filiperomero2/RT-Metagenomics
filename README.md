# RT-Metagenomics

RT-Metagenomics is a project for real-time metagenomic analysis, featuring separate backend and frontend components.

## Project Structure

- **back/**: Contains the backend code (APIs, data processing, etc.) that uses [ViralUnity](https://github.com/filiperomero2/ViralUnity/) as an engine to process the data.
- **front/**: Contains the frontend code (user interface).

## Getting Started

1. **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/RT-Metagenomics.git
    cd RT-Metagenomics
    ```

2. **Build docker image:**
    ```bash
    docker build -t rt-meta:dev .
    ```
    it may take some time to finish

3. **Run trhough docker image:**
    ```bash
    docker run -p 3000:3000 -p 8000:8000 rt-meta:dev
    ```

You can also run backend and frontend by itself

2. **Backend Setup:**
    - See [back/README.md](back/README.md) for backend installation and usage instructions.

3. **Frontend Setup:**
    - See [front/README.md](front/README.md) for frontend installation and usage instructions.

