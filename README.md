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
git clone --recurse-submodules https://github.com/filiperomero2/RT-Metagenomics.git
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
  -p 8000:8000 \
  -v /:/ \
  rt-meta:latest
```

## 📁 Volume Mapping Guide

### Essential Volume Mappings

The application requires access to your host machine's data directories. Here is hwo ti works:

```bash
-v /:/
```
- **Purpose**: Give docker environment acces to your files. You dont need to map your root, but keep in mind that the paths will be relative to this mapping.
- **Host path**: Replace the `/` before the `:` with the actual root path you want to map.
- **Container path**: `/` you normally will keep this unchanged.


## 🔧 Environment Variables

You can customize the application behavior using environment variables:

```bash
# Service settings
-e POLLING_INTERVAL=1
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

