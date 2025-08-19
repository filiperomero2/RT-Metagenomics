# RT-Metagenomics

RT-Metagenomics is a real-time metagenomic analysis platform featuring separate backend and frontend components. The system uses [ViralUnity](https://github.com/filiperomero2/ViralUnity/) as an engine to process metagenomic data.

## 🚀 Quick Start with Docker

The easiest way to run RT-Metagenomics is using Docker. This approach ensures consistent environments and easy setup.

### Prerequisites

- Docker installed on your system
- At least 2GB of available RAM
- Sufficient disk space for your metagenomic data

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/RT-Metagenomics.git
cd RT-Metagenomics
```

### 2. Build the Docker Image

```bash
docker build -t rt-meta:latest .
```

**Note:** The first build may take some minutes as it downloads and installs all dependencies including conda environments and Node.js packages.

### 3. Run with Docker

#### Basic Run (Development Mode)
```bash
docker run -p 3000:3000 -p 8000:8000 rt-meta:latest
```

#### Production Run with Volume Mapping
```bash
docker run -d \
  --name rt-metagenomics \
  -p 3000:3000 \
  -v /path/to/your/input/data:/app/rt-meta/input \
  -v /path/to/your/output/directory:/app/rt-meta/output \
  -v /path/to/your/kraken2db:/app/rt-meta/db/kraken2 \
  -v /path/to/your/kronadb:/app/rt-meta/db/krona \
  rt-meta:latest
```

## 📁 Volume Mapping Guide

### Essential Volume Mappings

The application requires access to your host machine's data directories. Here's what you need to map:

#### 1. Input Data Directory
```bash
-v /path/to/your/input/data:/app/rt-meta/input
```
- **Purpose**: Contains your metagenomic sequencing files (FASTQ, FASTA, etc.)
- **Host path**: Replace `/path/to/your/input/data` with the actual path to your data
- **Container path**: `/app/rt-meta/input` (fixed, but can change through environment variable)

#### 2. Output Directory (Optional)
```bash
-v /path/to/your/output/directory:/app/rt-meta/output
```
- **Purpose**: Stores analysis results, processed files, and logs
- **Host path**: Replace `/path/to/your/output/directory` with your desired output location
- **Container path**: `/app/rt-meta/output` (fixed, but can change through environment variable)
- **Use case**: Only needed if you wanna to access the output files later on

#### 3. Kraken2 Database Directory
```bash
-v /path/to/your/kraken2db:/app/rt-meta/db/kraken2
```
- **Purpose**: Configure the path to kraken2 database
- **Host path**: Replace `/path/to/your/kraken2db` with the path to your local kraken2 database
- **Container path**: You can choose any path, will be asked when running a metagenomics analysis

#### 4. Krona Database Directory
```bash
-v /path/to/your/kronadb:/app/rt-meta/db/kronadb
```
- **Purpose**: Configure the path to krona database
- **Host path**: Replace `/path/to/your/kronadb` with the path to your local krona database
- **Container path**: You can choose any path, will be asked when running a metagenomics analysis

### Example Volume Mapping Scenarios

#### Scenario 1: Local Development
```bash
docker run -p 3000:3000 -p 8000:8000 \
  -v $(pwd)/data/input:/app/back/input \
  -v $(pwd)/data/output:/app/back/output \
  rt-meta:latest
```

#### Scenario 2: Production with External Storage
```bash
docker run -d \
  --name rt-metagenomics \
  -p 3000:3000 \
  -v /mnt/nas/metagenomics/input:/app/back/input \
  -v /mnt/nas/metagenomics/output:/app/back/output \
  -v /mnt/nas/metagenomics/kraken2:/app/rt-meta/db/kraken2db \
  -v /mnt/nas/metagenomics/krona:/app/rt-meta/db/kronadb \
  rt-meta:latest
```

## 🔧 Environment Variables

You can customize the application behavior using environment variables:

```bash
# Data directories
-e INPUT_DIR=/app/back/input
-e OUTPUT_DIR=/app/back/output

# Service settings
-e POLLING_INTERVAL=1
-e MAX_RETRIES=3
-e TASK_TIMEOUT=3600
```

## 🌐 Accessing the Application

After running the container:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000 (only development)
- **API Documentation**: http://localhost:8000/docs (only development)

## 📊 Project Structure

```
RT-Metagenomics/
├── back/                    # Backend Python application
├── front/                   # Next.js frontend application
├── Dockerfile              # Docker image definition
├── run.sh                  # Container startup script
└── README.md               # This file
```

## 🐳 Docker Commands Reference

### Container Management
```bash
# Stop the container
docker stop rt-metagenomics

# Remove the container
docker rm rt-metagenomics

# View container logs
docker logs rt-metagenomics
```

### Image Management
```bash
# Remove image
docker rmi rt-meta:latest

# Update and rebuild
docker build --no-cache -t rt-meta:latest .
```

## 🚨 Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure your host directories have proper read/write permissions
2. **Port Already in Use**: Change the port mapping (e.g., `-p 3001:3000`)
3. **Insufficient Memory**: Increase Docker memory allocation to at least 2GB
4. **Build Failures**: Clear Docker cache with `docker system prune -a`

### Data Access Issues
- Verify volume paths are correct and accessible
- Check file permissions on host directories
- Ensure sufficient disk space

## 📚 Additional Documentation

- **Backend**: See [back/README.md](back/README.md) for detailed backend setup
- **Frontend**: See [front/README.md](front/README.md) for frontend development
- **API**: Interactive API documentation available at `/docs` endpoint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker
5. Submit a pull request

## 📄 License

TBD

## 🆘 Support

For issues and questions:
- Check the troubleshooting section above
- Review the backend and frontend READMEs
- Open an issue on GitHub

